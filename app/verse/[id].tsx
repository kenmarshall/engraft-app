/**
 * Verse Detail Screen
 *
 * Shows:
 * - Full KJV verse text (serif, hero)
 * - Mastery level, interval, repetitions, next review date
 * - Review Now shortcut
 * - Delete option with confirmation
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Colors, FontSizes, FontWeights, Fonts,
  Spacing, Radii, Shadows, TouchTarget,
} from '@/constants/theme';
import { Strings } from '@/constants/strings';
import { getCard, removeCard, type VerseCard } from '@/utils/storage';
import { formatReference, formatReferenceRange } from '@/utils/bible';
import { getMasteryLevel, formatDueDate, formatAddedDate, isDue } from '@/utils/sm2';
import { MasteryBadge } from '@/components/MasteryBadge';

export default function VerseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [card, setCard] = useState<VerseCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const loadCard = useCallback(async () => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    try {
      const found = await getCard(id);
      if (!found) {
        setNotFound(true);
      } else {
        setCard(found);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadCard();
    }, [loadCard]),
  );

  const handleDelete = () => {
    Alert.alert(
      Strings.verseDetail.deleteTitle,
      Strings.verseDetail.deleteMessage,
      [
        {
          text: Strings.verseDetail.deleteCancel,
          style: 'cancel',
        },
        {
          text: Strings.verseDetail.deleteConfirm,
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            await removeCard(id);
            router.back();
          },
        },
      ],
    );
  };

  const handleReviewNow = () => {
    router.push('/(tabs)/review');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (notFound || !card) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>{Strings.common.error}</Text>
          <Text style={styles.errorBody}>{Strings.verseDetail.notFound}</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
          >
            <Text style={styles.backButtonText}>{Strings.common.back}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const mastery = getMasteryLevel(card.schedule);
  const due = isDue(card.schedule);
  const dueDateLabel = formatDueDate(card.schedule.dueDate);
  const addedDate = formatAddedDate(card.addedAt);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Reference */}
        <Text style={styles.reference}>
          {card.endVerse
            ? formatReferenceRange(card.book, card.chapter, card.verse, card.endVerse)
            : formatReference(card.book, card.chapter, card.verse)}
        </Text>

        {/* Verse Text Card */}
        <View style={styles.verseCard}>
          <Text style={styles.verseText}>{card.text}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <StatCell label={Strings.verseDetail.mastery}>
            <MasteryBadge level={mastery} size="md" />
          </StatCell>

          <StatCell label={Strings.verseDetail.nextReview}>
            <Text style={[styles.statValue, due && styles.statValueDue]}>
              {due ? Strings.deck.dueNow : dueDateLabel}
            </Text>
          </StatCell>

          <StatCell label={Strings.verseDetail.interval}>
            <Text style={styles.statValue}>
              {Strings.verseDetail.intervalDays(card.schedule.interval)}
            </Text>
          </StatCell>

          <StatCell label={Strings.verseDetail.repetitions}>
            <Text style={styles.statValue}>{card.schedule.repetition}</Text>
          </StatCell>
        </View>

        <Text style={styles.addedLabel}>
          {Strings.verseDetail.addedOn}: {addedDate}
        </Text>

        {/* Review Now */}
        {due && (
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={handleReviewNow}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={Strings.verseDetail.reviewNow}
          >
            <Text style={styles.reviewButtonText}>{Strings.verseDetail.reviewNow}</Text>
          </TouchableOpacity>
        )}

        {/* Delete */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={Strings.verseDetail.deleteTitle}
        >
          <Text style={styles.deleteButtonText}>{Strings.verseDetail.deleteTitle}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── StatCell ────────────────────────────────────────────────────────────────

function StatCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statLabel}>{label}</Text>
      {children}
    </View>
  );
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
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },

  // Reference
  reference: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.accent,
    fontFamily: Fonts.sans,
    marginBottom: Spacing.lg,
    letterSpacing: 0.3,
  },

  // Verse Card
  verseCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadows.elevated,
  },
  verseText: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.serif,
    color: Colors.text,
    lineHeight: 30,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  statCell: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    padding: Spacing.base,
    gap: Spacing.xs,
    ...Shadows.card,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
    fontWeight: FontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statValue: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
    fontFamily: Fonts.sans,
  },
  statValueDue: {
    color: Colors.accent,
  },

  // Added date
  addedLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    fontFamily: Fonts.sans,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    fontStyle: 'italic',
  },

  // Review button
  reviewButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    minHeight: TouchTarget,
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  reviewButtonText: {
    color: Colors.card,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    fontFamily: Fonts.sans,
  },

  // Delete button
  deleteButton: {
    borderWidth: 1.5,
    borderColor: Colors.destructive,
    borderRadius: Radii.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    minHeight: TouchTarget,
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: Colors.destructive,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    fontFamily: Fonts.sans,
  },

  // Error
  errorTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
    fontFamily: Fonts.serif,
    textAlign: 'center',
  },
  errorBody: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    minHeight: TouchTarget,
    justifyContent: 'center',
  },
  backButtonText: {
    color: Colors.card,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    fontFamily: Fonts.sans,
  },
});
