import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  Colors, FontSizes, FontWeights, Fonts,
  Spacing, Radii, Shadows, TouchTarget,
} from '@/constants/theme';
import { Strings } from '@/constants/strings';
import { lookupVerse } from '@/utils/bible';
import { makeCardId, seedDeck } from '@/utils/storage';

interface WelcomeModalProps {
  visible: boolean;
  onAddFirst: () => void;
  onDismiss: () => void;
}

/** Well-known KJV verses used as onboarding seed data. */
const STARTER_VERSES = [
  { book: 'John', chapter: 3, verse: 16 },
  { book: 'Psalms', chapter: 23, verse: 1 },
  { book: 'Romans', chapter: 8, verse: 28 },
  { book: 'Philippians', chapter: 4, verse: 13 },
  { book: 'Jeremiah', chapter: 29, verse: 11 },
  { book: 'Joshua', chapter: 1, verse: 9 },
  { book: 'Proverbs', chapter: 3, verse: 5 },
  { book: 'Isaiah', chapter: 40, verse: 31 },
];


export function WelcomeModal({ visible, onAddFirst, onDismiss }: WelcomeModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadedCount, setLoadedCount] = useState<number | null>(null);

  const handleLoadStarter = async () => {
    setLoading(true);
    const cards = STARTER_VERSES.flatMap(({ book, chapter, verse }) => {
      const v = lookupVerse(book, chapter, verse);
      if (!v) return [];
      return [{ id: makeCardId(book, chapter, verse), book, chapter, verse, text: v.text }];
    });
    await seedDeck(cards);
    setLoadedCount(cards.length);
    setLoading(false);
    setTimeout(onDismiss, 1200);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{Strings.onboarding.title}</Text>
          <Text style={styles.tagline}>
            {Strings.tagline}
            <Text style={styles.taglineRef}> — {Strings.taglineReference}</Text>
          </Text>
          <Text style={styles.body}>{Strings.onboarding.body}</Text>

          {loadedCount !== null ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>
                {Strings.onboarding.starterLoaded(loadedCount)}
              </Text>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={onAddFirst}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={Strings.onboarding.addFirst}
              >
                <Text style={styles.primaryButtonText}>{Strings.onboarding.addFirst}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, loading && styles.buttonDisabled]}
                onPress={handleLoadStarter}
                disabled={loading}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={Strings.onboarding.loadStarter}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.accent} size="small" />
                ) : (
                  <Text style={styles.secondaryButtonText}>{Strings.onboarding.loadStarter}</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 28, 30, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    ...Shadows.elevated,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    fontFamily: Fonts.serif,
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontSize: FontSizes.sm,
    color: Colors.accent,
    fontFamily: Fonts.serif,
    fontStyle: 'italic',
    marginBottom: Spacing.lg,
  },
  taglineRef: {
    fontSize: FontSizes.sm,
    color: Colors.accent,
    fontFamily: Fonts.serif,
    fontStyle: 'italic',
  },
  body: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  primaryButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    minHeight: TouchTarget,
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  primaryButtonText: {
    color: Colors.card,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    fontFamily: Fonts.sans,
  },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: Colors.accent,
    borderRadius: Radii.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    minHeight: TouchTarget,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: Colors.accent,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    fontFamily: Fonts.sans,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  successBox: {
    backgroundColor: Colors.accentLight,
    borderRadius: Radii.md,
    padding: Spacing.base,
    alignItems: 'center',
    minHeight: TouchTarget,
    justifyContent: 'center',
  },
  successText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    color: Colors.accent,
    fontFamily: Fonts.sans,
  },
});
