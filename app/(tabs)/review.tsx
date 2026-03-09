/**
 * Review Screen
 *
 * Runs a spaced-repetition review session:
 * 1. Load all due cards
 * 2. Show cloze card — user taps blanks to reveal
 * 3. User rates recall (Again / Hard / Good / Easy)
 * 4. Update SM-2 schedule and persist
 * 5. Advance to next card
 * 6. Session complete screen when all cards reviewed
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Colors, FontSizes, FontWeights, Fonts,
  Spacing, Radii, Shadows, TouchTarget,
} from '@/constants/theme';
import { Strings } from '@/constants/strings';
import { getDueCards, updateCardSchedule, type VerseCard } from '@/utils/storage';
import { formatReference } from '@/utils/bible';
import { scheduleCard, type Rating } from '@/utils/sm2';
import { generateCloze, type ClozeResult } from '@/utils/cloze';

interface RatingButtonConfig {
  rating: Rating;
  label: string;
  hint: string;
  color: string;
}

const RATING_BUTTONS: RatingButtonConfig[] = [
  { rating: 'again', label: Strings.review.again, hint: Strings.review.againHint, color: Colors.destructive },
  { rating: 'hard',  label: Strings.review.hard,  hint: Strings.review.hardHint,  color: Colors.warning },
  { rating: 'good',  label: Strings.review.good,  hint: Strings.review.goodHint,  color: Colors.success },
  { rating: 'easy',  label: Strings.review.easy,  hint: Strings.review.easyHint,  color: Colors.accent },
];

export default function ReviewScreen() {
  const router = useRouter();

  const [queue, setQueue] = useState<VerseCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [cloze, setCloze] = useState<ClozeResult | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setDone(false);
    setCurrentIndex(0);
    setRevealed(new Set());
    setShowRating(false);
    try {
      const due = await getDueCards();
      setQueue(due);
      if (due.length > 0) {
        setCloze(generateCloze(due[0].text));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadQueue();
    }, [loadQueue]),
  );

  const currentCard = queue[currentIndex] ?? null;

  const handleRevealBlank = (blankIndex: number) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      next.add(blankIndex);
      return next;
    });
  };

  const handleRevealAll = () => {
    if (!cloze) return;
    setRevealed(new Set(cloze.blankIndices));
    setShowRating(true);
  };

  const handleRate = async (rating: Rating) => {
    if (!currentCard) return;

    const updatedSchedule = scheduleCard(currentCard.schedule, rating);
    await updateCardSchedule(currentCard.id, updatedSchedule);

    const nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) {
      setDone(true);
    } else {
      const nextCard = queue[nextIndex];
      setCurrentIndex(nextIndex);
      setRevealed(new Set());
      setShowRating(false);
      setCloze(generateCloze(nextCard.text));
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.accent} size="large" />
          <Text style={styles.loadingText}>{Strings.common.loading}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Empty — nothing due ──────────────────────────────────────────────────

  if (queue.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>{Strings.review.emptyTitle}</Text>
          <Text style={styles.emptyBody}>{Strings.review.emptyBody}</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(tabs)/add')}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>{Strings.review.emptyAction}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Session complete ────────────────────────────────────────────────────

  if (done) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.completeTitle}>{Strings.review.sessionComplete}</Text>
          <Text style={styles.completeBody}>{Strings.review.sessionCompleteBody}</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(tabs)')}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>{Strings.review.sessionCompleteAction}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Active Review ───────────────────────────────────────────────────────

  if (!currentCard || !cloze) return null;

  const allBlanksRevealed =
    cloze.blankIndices.length === 0 ||
    cloze.blankIndices.every((i) => revealed.has(i));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${((currentIndex) / queue.length) * 100}%` },
          ]}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Counter */}
        <Text style={styles.counter}>
          {Strings.review.cardProgress(currentIndex + 1, queue.length)}
        </Text>

        {/* Reference */}
        <Text style={styles.reference}>
          {formatReference(currentCard.book, currentCard.chapter, currentCard.verse)}
        </Text>

        {/* Cloze Card */}
        <View style={styles.card}>
          <ClozeText
            cloze={cloze}
            revealed={revealed}
            showRating={showRating}
            onRevealBlank={handleRevealBlank}
          />
        </View>

        {/* Hint text */}
        {!showRating && (
          <Text style={styles.hint}>
            {cloze.blankIndices.length > 0
              ? Strings.review.tapToReveal
              : Strings.review.tapToRevealAll}
          </Text>
        )}

        {/* Reveal all button */}
        {!showRating && (
          <TouchableOpacity
            style={styles.revealButton}
            onPress={handleRevealAll}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={Strings.review.tapToRevealAll}
          >
            <Text style={styles.revealButtonText}>{Strings.review.tapToRevealAll}</Text>
          </TouchableOpacity>
        )}

        {/* Rating buttons */}
        {showRating && (
          <View style={styles.ratingSection}>
            <Text style={styles.ratingLabel}>{Strings.review.rateYourRecall}</Text>
            <View style={styles.ratingButtons}>
              {RATING_BUTTONS.map(({ rating, label, hint, color }) => (
                <TouchableOpacity
                  key={rating}
                  style={[styles.ratingButton, { borderColor: color }]}
                  onPress={() => handleRate(rating)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={`${label}: ${hint}`}
                >
                  <Text style={[styles.ratingButtonLabel, { color }]}>{label}</Text>
                  <Text style={styles.ratingButtonHint}>{hint}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── ClozeText Component ─────────────────────────────────────────────────────

interface ClozeTextProps {
  cloze: ClozeResult;
  revealed: Set<number>;
  showRating: boolean;
  onRevealBlank: (index: number) => void;
}

function ClozeText({ cloze, revealed, showRating, onRevealBlank }: ClozeTextProps) {
  return (
    <Text style={styles.verseText} accessibilityRole="text">
      {cloze.tokens.map((token) => {
        if (!token.isBlank) {
          return (
            <Text key={token.index} style={styles.verseWord}>
              {token.word}{token.trailing}
            </Text>
          );
        }

        const isRevealed = revealed.has(token.index);

        if (isRevealed || showRating) {
          return (
            <Text key={token.index}>
              <Text style={styles.revealedWord}>{token.word}</Text>
              <Text style={styles.verseWord}>{token.trailing}</Text>
            </Text>
          );
        }

        return (
          <Text
            key={token.index}
            onPress={() => onRevealBlank(token.index)}
            accessibilityRole="button"
            accessibilityLabel={`Hidden word, tap to reveal`}
          >
            <Text style={styles.blank}>{'_'.repeat(Math.max(3, Math.min(8, token.word.length)))}</Text>
            <Text style={styles.verseWord}>{token.trailing}</Text>
          </Text>
        );
      })}
    </Text>
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
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
  },

  // Progress
  progressBar: {
    height: 3,
    backgroundColor: Colors.border,
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.accent,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },

  // Counter
  counter: {
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
    fontFamily: Fonts.sans,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },

  // Reference
  reference: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.accent,
    fontFamily: Fonts.sans,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    letterSpacing: 0.3,
  },

  // Card
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    minHeight: 160,
    ...Shadows.elevated,
  },

  // Verse text
  verseText: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.serif,
    color: Colors.text,
    lineHeight: 32,
  },
  verseWord: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.serif,
    color: Colors.text,
  },
  blank: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.serif,
    color: Colors.blankUnderline,
    textDecorationLine: 'underline',
    letterSpacing: 2,
    fontWeight: FontWeights.bold,
  },
  revealedWord: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.serif,
    color: Colors.accent,
    fontWeight: FontWeights.semibold,
    backgroundColor: Colors.blankRevealBackground,
  },

  // Hint
  hint: {
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
    fontFamily: Fonts.sans,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },

  // Reveal button
  revealButton: {
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    alignSelf: 'center',
    minHeight: TouchTarget,
    justifyContent: 'center',
  },
  revealButtonText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    color: Colors.text,
    fontFamily: Fonts.sans,
  },

  // Rating
  ratingSection: {
    marginTop: Spacing.lg,
  },
  ratingLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontWeight: FontWeights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  ratingButton: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: Radii.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    minHeight: TouchTarget + Spacing.sm,
    justifyContent: 'center',
    backgroundColor: Colors.card,
    ...Shadows.card,
  },
  ratingButtonLabel: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    fontFamily: Fonts.sans,
  },
  ratingButtonHint: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    fontFamily: Fonts.sans,
    marginTop: Spacing.xxs,
  },

  // Empty / Complete
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
    fontFamily: Fonts.serif,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
    textAlign: 'center',
    lineHeight: 22,
  },
  completeTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    fontFamily: Fonts.serif,
    textAlign: 'center',
  },
  completeBody: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  primaryButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: Radii.full,
    minHeight: TouchTarget,
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  primaryButtonText: {
    color: Colors.card,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    fontFamily: Fonts.sans,
  },
});
