/**
 * Settings Screen
 *
 * Sections:
 *   Review  — Cloze difficulty
 *   Account — Upgrade to Pro / Pro status
 *   Help    — How to use Engraft
 *   About   — Privacy policy, app version
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Colors, FontSizes, FontWeights, Fonts,
  Spacing, Radii, Shadows, TouchTarget,
} from '@/constants/theme';
import { Strings } from '@/constants/strings';
import { PRIVACY_POLICY_URL } from '@/constants/pro';
import { getDifficulty, setDifficulty, type ClozeDifficulty } from '@/utils/storage';
import { presentCustomerCenter } from '@/utils/purchases';
import { useProStatus } from '@/contexts/ProContext';

const APP_VERSION = '1.0.0';

const DIFFICULTY_OPTIONS: { value: ClozeDifficulty; label: string; hint: string }[] = [
  { value: 'easy',   label: Strings.settings.difficultyEasy,   hint: Strings.settings.difficultyEasyHint },
  { value: 'medium', label: Strings.settings.difficultyMedium, hint: Strings.settings.difficultyMediumHint },
  { value: 'hard',   label: Strings.settings.difficultyHard,   hint: Strings.settings.difficultyHardHint },
];

const HELP_STEPS = [
  { title: Strings.settings.helpStep1Title, body: Strings.settings.helpStep1Body },
  { title: Strings.settings.helpStep2Title, body: Strings.settings.helpStep2Body },
  { title: Strings.settings.helpStep3Title, body: Strings.settings.helpStep3Body },
  { title: Strings.settings.helpStep4Title, body: Strings.settings.helpStep4Body },
];

export default function SettingsScreen() {
  const { isPro, openPaywall } = useProStatus();
  const [difficulty, setDifficultyState] = useState<ClozeDifficulty>('medium');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      getDifficulty().then((d) => {
        setDifficultyState(d);
        setLoading(false);
      });
    }, []),
  );

  const handleDifficultyChange = async (value: ClozeDifficulty) => {
    setDifficultyState(value);
    await setDifficulty(value);
  };

  const handlePrivacyPolicy = () => {
    WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL).catch(() => {});
  };

  const currentDifficulty = DIFFICULTY_OPTIONS.find((o) => o.value === difficulty) ?? DIFFICULTY_OPTIONS[1];

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      ) : (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* ── REVIEW ─────────────────────────────────────────────────────── */}
        <SectionHeader label={Strings.settings.sectionReview} />

        <View style={styles.card}>
          <Text style={styles.rowLabel}>{Strings.settings.difficultyLabel}</Text>
          <Text style={styles.rowSub}>{currentDifficulty.hint}</Text>
          <View style={styles.difficultyRow}>
            {DIFFICULTY_OPTIONS.map((opt) => {
              const selected = difficulty === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.difficultyChip, selected && styles.difficultyChipSelected]}
                  onPress={() => handleDifficultyChange(opt.value)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={opt.label}
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.difficultyChipText, selected && styles.difficultyChipTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── ACCOUNT ────────────────────────────────────────────────────── */}
        <SectionHeader label={Strings.settings.sectionAccount} />

        <View style={styles.card}>
          {isPro ? (
            <>
              <View style={styles.row}>
                <View style={styles.rowTextGroup}>
                  <Text style={styles.rowLabel}>{Strings.settings.proActive}</Text>
                  <Text style={styles.rowSub}>{Strings.settings.proActiveSub}</Text>
                </View>
                <Text style={styles.proCheckmark}>✓</Text>
              </View>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.row}
                onPress={() => { presentCustomerCenter().catch(() => {}); }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={Strings.settings.manageSubscription}
              >
                <Text style={styles.rowLabel}>{Strings.settings.manageSubscription}</Text>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.row}
              onPress={openPaywall}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={Strings.settings.upgradePro}
            >
              <View style={styles.rowTextGroup}>
                <Text style={[styles.rowLabel, styles.accentText]}>{Strings.settings.upgradePro}</Text>
                <Text style={styles.rowSub}>{Strings.settings.upgradeProSub}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── HELP ───────────────────────────────────────────────────────── */}
        <SectionHeader label={Strings.settings.sectionHelp} />

        <View style={styles.card}>
          <Text style={styles.helpHeading}>{Strings.settings.howToUse}</Text>
          {HELP_STEPS.map((step, i) => (
            <View key={i} style={[styles.helpStep, i > 0 && styles.helpStepBorder]}>
              <Text style={styles.helpStepTitle}>{step.title}</Text>
              <Text style={styles.helpStepBody}>{step.body}</Text>
            </View>
          ))}
        </View>

        {/* ── ABOUT ──────────────────────────────────────────────────────── */}
        <SectionHeader label={Strings.settings.sectionAbout} />

        <View style={styles.card}>
          <Text style={styles.aboutDescription}>{Strings.settings.appDescription}</Text>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.row}
            onPress={handlePrivacyPolicy}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={Strings.settings.privacyPolicy}
          >
            <Text style={styles.rowLabel}>{Strings.settings.privacyPolicy}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={[styles.row, styles.rowNoAction]}>
            <Text style={styles.rowLabel}>{Strings.settings.version(APP_VERSION)}</Text>
          </View>
        </View>

      </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── SectionHeader ────────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return <Text style={styles.sectionHeader}>{label}</Text>;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },

  // Section header
  sectionHeader: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },

  // Card (groups rows)
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    ...Shadows.card,
  },

  // Generic row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TouchTarget,
    paddingVertical: Spacing.sm,
  },
  rowNoAction: {
    paddingVertical: Spacing.sm,
  },
  rowTextGroup: {
    flex: 1,
  },
  rowLabel: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    color: Colors.text,
    fontFamily: Fonts.sans,
  },
  rowSub: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
    marginTop: 2,
  },
  accentText: {
    color: Colors.accent,
  },
  chevron: {
    fontSize: FontSizes.xl,
    color: Colors.textTertiary,
    fontFamily: Fonts.sans,
    marginLeft: Spacing.sm,
  },
  proCheckmark: {
    fontSize: FontSizes.lg,
    color: Colors.success,
    fontFamily: Fonts.sans,
    fontWeight: FontWeights.bold,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },

  // Difficulty selector
  difficultyRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  difficultyChip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
    minHeight: TouchTarget,
    justifyContent: 'center',
  },
  difficultyChipSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight,
  },
  difficultyChipText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.sans,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  difficultyChipTextSelected: {
    color: Colors.accent,
    fontWeight: FontWeights.semibold,
  },

  // Help section
  helpHeading: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
    fontFamily: Fonts.sans,
    paddingVertical: Spacing.sm,
  },
  helpStep: {
    paddingVertical: Spacing.md,
  },
  helpStepBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  helpStepTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
    fontFamily: Fonts.sans,
    marginBottom: Spacing.xs,
  },
  helpStepBody: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
    lineHeight: 20,
  },

  // About section
  aboutDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
    lineHeight: 20,
    paddingVertical: Spacing.sm,
  },
});
