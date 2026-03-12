/**
 * Pro Paywall
 *
 * Full-screen modal that presents Engraft Pro subscription options.
 * Fetches live pricing from RevenueCat; handles purchase and restore.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import {
  Colors, Fonts, FontSizes, FontWeights,
  Radii, Shadows, Spacing, TouchTarget,
} from '@/constants/theme';
import { Strings } from '@/constants/strings';
import {
  fetchOfferings,
  purchasePackage,
  restorePurchases,
  type PurchasesOffering,
  type PurchasesPackage,
} from '@/utils/purchases';

interface ProPaywallProps {
  visible: boolean;
  onClose: () => void;
  onPurchaseSuccess: () => void;
}

const PRO_FEATURES = [
  Strings.pro.feature1,
  Strings.pro.feature2,
  Strings.pro.feature3,
] as const;

export function ProPaywall({ visible, onClose, onPurchaseSuccess }: ProPaywallProps) {
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [selectedPkg, setSelectedPkg] = useState<PurchasesPackage | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const loadOffering = useCallback(async () => {
    setLoadingOffers(true);
    const result = await fetchOfferings();
    setOffering(result);
    // Default-select annual if available, otherwise the first package
    const defaultPkg = result?.annual ?? result?.availablePackages[0] ?? null;
    setSelectedPkg(defaultPkg);
    setLoadingOffers(false);
  }, []);

  useEffect(() => {
    if (visible) loadOffering();
  }, [visible, loadOffering]);

  const handlePurchase = async () => {
    if (!selectedPkg || purchasing) return;
    setPurchasing(true);
    try {
      const result = await purchasePackage(selectedPkg);
      if (result.status === 'success') {
        onPurchaseSuccess();
      } else if (result.status === 'error') {
        Alert.alert(Strings.common.error, result.message);
      }
      // 'cancelled' — user dismissed the system sheet, do nothing
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (restoring) return;
    setRestoring(true);
    try {
      const result = await restorePurchases();
      if (result.status === 'success') {
        onPurchaseSuccess();
      } else if (result.status === 'none') {
        Alert.alert(Strings.pro.paywallRestoredNoneTitle, Strings.pro.paywallRestoredNone);
      } else {
        Alert.alert(Strings.common.error, result.message);
      }
    } finally {
      setRestoring(false);
    }
  };

  const annualPkg = offering?.annual ?? null;
  const monthlyPkg = offering?.monthly ?? null;
  const packages = [annualPkg, monthlyPkg].filter((p): p is PurchasesPackage => p !== null);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Close button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{Strings.pro.badge}</Text>
            </View>
            <Text style={styles.heroTitle}>{Strings.pro.paywallTitle}</Text>
            <Text style={styles.heroSubtitle}>{Strings.pro.paywallSubtitle}</Text>
          </View>

          {/* Feature list */}
          <View style={styles.features}>
            {PRO_FEATURES.map((feature, i) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          {/* Packages */}
          {loadingOffers ? (
            <View style={styles.offersPlaceholder}>
              <ActivityIndicator color={Colors.accent} />
              <Text style={styles.offersPlaceholderText}>{Strings.pro.paywallLoading}</Text>
            </View>
          ) : packages.length === 0 ? (
            <View style={styles.offersPlaceholder}>
              <Text style={styles.offersErrorText}>{Strings.pro.paywallNoOffers}</Text>
              <TouchableOpacity onPress={loadOffering} activeOpacity={0.7} accessibilityRole="button">
                <Text style={styles.retryText}>{Strings.common.retry}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.packages}>
              {packages.map((pkg) => {
                const isAnnual = pkg === annualPkg;
                const isSelected = selectedPkg?.identifier === pkg.identifier;
                return (
                  <TouchableOpacity
                    key={pkg.identifier}
                    style={[styles.packageCard, isSelected && styles.packageCardSelected]}
                    onPress={() => setSelectedPkg(pkg)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`${isAnnual ? Strings.pro.paywallAnnual : Strings.pro.paywallMonthly} — ${pkg.product.priceString}`}
                  >
                    <View style={styles.packageInfo}>
                      <View style={styles.packageTitleRow}>
                        <Text style={[styles.packageTitle, isSelected && styles.packageTitleSelected]}>
                          {isAnnual ? Strings.pro.paywallAnnual : Strings.pro.paywallMonthly}
                        </Text>
                        {isAnnual && (
                          <View style={styles.bestValueBadge}>
                            <Text style={styles.bestValueText}>{Strings.pro.paywallBestValue}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.packagePrice, isSelected && styles.packagePriceSelected]}>
                        {pkg.product.priceString}
                        <Text style={styles.packagePricePer}>
                          {isAnnual ? Strings.pro.paywallPerYear : Strings.pro.paywallPerMonth}
                        </Text>
                      </Text>
                    </View>
                    <View style={[styles.radio, isSelected && styles.radioSelected]}>
                      {isSelected && <View style={styles.radioFill} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* CTA */}
          <TouchableOpacity
            style={[
              styles.ctaButton,
              (!selectedPkg || purchasing || loadingOffers) && styles.ctaButtonDisabled,
            ]}
            onPress={handlePurchase}
            disabled={!selectedPkg || purchasing || loadingOffers}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            {purchasing ? (
              <ActivityIndicator color={Colors.card} />
            ) : (
              <Text style={styles.ctaText}>
                {selectedPkg
                  ? Strings.pro.paywallCta(selectedPkg === annualPkg)
                  : Strings.pro.paywallAction}
              </Text>
            )}
          </TouchableOpacity>

          {/* Restore */}
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={restoring}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Text style={styles.restoreText}>
              {restoring ? Strings.pro.paywallRestoring : Strings.pro.paywallRestore}
            </Text>
          </TouchableOpacity>

          {/* Terms */}
          <Text style={styles.terms}>{Strings.pro.paywallTerms}</Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: TouchTarget,
    height: TouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    marginTop: Spacing.xs,
  },

  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },

  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  heroBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.full,
    marginBottom: Spacing.md,
  },
  heroBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.card,
    fontFamily: Fonts.sans,
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontSize: FontSizes.display,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    fontFamily: Fonts.serif,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Features
  features: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
    ...Shadows.card,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  featureText: {
    fontSize: FontSizes.base,
    color: Colors.text,
    fontFamily: Fonts.sans,
    flex: 1,
  },

  // Package loading / error
  offersPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  offersPlaceholderText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
  },
  offersErrorText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
    textAlign: 'center',
  },
  retryText: {
    fontSize: FontSizes.base,
    color: Colors.accent,
    fontFamily: Fonts.sans,
    fontWeight: FontWeights.semibold,
  },

  // Package cards
  packages: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.base,
    borderWidth: 2,
    borderColor: Colors.border,
    minHeight: TouchTarget + Spacing.md,
    ...Shadows.card,
  },
  packageCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight,
  },
  packageInfo: {
    flex: 1,
  },
  packageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  packageTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
  },
  packageTitleSelected: {
    color: Colors.accent,
  },
  bestValueBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  bestValueText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.card,
    fontFamily: Fonts.sans,
  },
  packagePrice: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
  },
  packagePriceSelected: {
    color: Colors.accent,
  },
  packagePricePer: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.regular,
  },

  // Radio button
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
  },
  radioSelected: {
    borderColor: Colors.accent,
  },
  radioFill: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.accent,
  },

  // CTA button
  ctaButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.full,
    height: TouchTarget + Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.elevated,
  },
  ctaButtonDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.card,
    fontFamily: Fonts.sans,
  },

  // Restore
  restoreButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget,
  },
  restoreText: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
  },

  // Terms
  terms: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    fontFamily: Fonts.sans,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
});
