/**
 * Review Screen
 *
 * Routes each card to one of two modes based on mastery level:
 *  - Learning  (New / Learning mastery): progressive blanking across passes
 *  - Review    (Mature mastery):         cloze deletion flow
 *
 * Learning pass structure:
 *  Pass 1: reference + full verse + reference — user reads aloud, taps "Continue"
 *  Pass 2+: both references blanked, content words blanked first (2 per pass),
 *           then stop words. All blanks reset each pass.
 *  Final pass: everything blanked. SM-2 rating appears after all blanks revealed.
 *
 * Rating "Again" on any card resets repetition → 0 (New mastery), so the card
 * automatically routes back to Learning mode next session.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import {
  Colors, FontSizes, FontWeights, Fonts,
  Spacing, Radii, Shadows, TouchTarget,
} from '@/constants/theme';
import { Strings } from '@/constants/strings';
import {
  getDueCards, getCard, updateCardSchedule, getDifficulty,
  type VerseCard, type ClozeDifficulty,
} from '@/utils/storage';
import { useProStatus } from '@/contexts/ProContext';
import { formatReference, formatReferenceRange } from '@/utils/bible';
import { scheduleCard, getMasteryLevel, type Rating } from '@/utils/sm2';
import {
  generateCloze, tokenizeVerse, getProgressiveWordOrder, getBlankPlaceholder,
  type ClozeResult, type VerseToken,
} from '@/utils/cloze';

// ── Difficulty resolution ─────────────────────────────────────────────────────

/**
 * Resolve the stored ClozeDifficulty to a concrete level for generateCloze.
 * 'auto' maps mastery → difficulty; Pro-only tiers fall back to 'medium' for free users.
 */
function resolveClozeDifficulty(
  difficulty: ClozeDifficulty,
  isPro: boolean,
  mastery: 'new' | 'learning' | 'mature',
): 'easy' | 'medium' | 'hard' {
  if (!isPro && (difficulty === 'hard' || difficulty === 'auto')) return 'medium';
  if (difficulty === 'auto') {
    if (mastery === 'new') return 'easy';
    if (mastery === 'learning') return 'medium';
    return 'hard';
  }
  return difficulty as 'easy' | 'medium' | 'hard';
}

// ── Rating button config ──────────────────────────────────────────────────────

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

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ReviewScreen() {
  const router = useRouter();
  const { cardId } = useLocalSearchParams<{ cardId?: string }>();
  const { isPro, openPaywall } = useProStatus();
  const isProRef = React.useRef(isPro);
  isProRef.current = isPro;

  // ── Queue ──
  const [queue, setQueue] = useState<VerseCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [isRating, setIsRating] = useState(false);

  // ── Card mode ──
  const [cardMode, setCardMode] = useState<'learning' | 'review'>('learning');

  // ── Learning state ──
  const [learningPass, setLearningPass] = useState(1);
  const [learningTokens, setLearningTokens] = useState<VerseToken[]>([]);
  const [learningWordOrder, setLearningWordOrder] = useState<number[]>([]);
  const [refTopRevealed, setRefTopRevealed] = useState(false);
  const [refBotRevealed, setRefBotRevealed] = useState(false);

  // ── Review (cloze) state ──
  const [cloze, setCloze] = useState<ClozeResult | null>(null);

  // ── Shared ──
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [showRating, setShowRating] = useState(false);

  const difficultyRef = React.useRef<ClozeDifficulty>('medium');

  // ── Card initialization ───────────────────────────────────────────────────

  const initCard = useCallback((card: VerseCard, difficulty: ClozeDifficulty) => {
    const mastery = getMasteryLevel(card.schedule);
    const mode = (mastery === 'new' && isProRef.current) ? 'learning' : 'review';
    setCardMode(mode);
    setRevealed(new Set());
    setShowRating(false);
    setIsRating(false);

    if (mode === 'learning') {
      setLearningTokens(tokenizeVerse(card.text));
      setLearningWordOrder(getProgressiveWordOrder(card.text));
      setLearningPass(1);
      setRefTopRevealed(false);
      setRefBotRevealed(false);
    } else {
      const resolved = resolveClozeDifficulty(difficulty, isProRef.current, mastery);
      setCloze(generateCloze(card.text, 0, resolved));
    }
  }, []);

  // ── Queue loading ─────────────────────────────────────────────────────────

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setDone(false);
    setCurrentIndex(0);
    try {
      const difficulty = await getDifficulty(isProRef.current ? 'auto' : 'medium');
      difficultyRef.current = difficulty;

      if (cardId) {
        const card = await getCard(cardId);
        if (card) {
          setQueue([card]);
          initCard(card, difficulty);
          return;
        }
      }

      const due = await getDueCards();
      setQueue(due);
      if (due.length > 0) {
        initCard(due[0], difficulty);
      }
    } finally {
      setLoading(false);
    }
  }, [cardId, initCard]);

  useFocusEffect(
    useCallback(() => { loadQueue(); }, [loadQueue]),
  );

  const currentCard = queue[currentIndex] ?? null;

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleExit = useCallback(() => { router.back(); }, [router]);

  // Learning
  const handleLearningContinue = useCallback(() => {
    setLearningPass(2);
  }, []);

  const handleNextPass = useCallback(() => {
    setLearningPass(p => p + 1);
    setRevealed(new Set());
    setRefTopRevealed(false);
    setRefBotRevealed(false);
  }, []);

  const handleRevealWordLearning = useCallback((index: number) => {
    setRevealed(prev => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }, []);

  const handleRevealAllLearning = useCallback(() => {
    const count = Math.min((learningPass - 1) * 2, learningWordOrder.length);
    setRevealed(new Set(learningWordOrder.slice(0, count)));
    setRefTopRevealed(true);
    setRefBotRevealed(true);
  }, [learningPass, learningWordOrder]);

  // Review (cloze)
  const handleRevealBlank = useCallback((blankIndex: number) => {
    setRevealed(prev => {
      const next = new Set(prev);
      next.add(blankIndex);
      if (cloze && cloze.blankIndices.every(i => next.has(i))) {
        setShowRating(true);
      }
      return next;
    });
  }, [cloze]);

  const handleRevealAll = useCallback(() => {
    if (!cloze) return;
    setRevealed(new Set(cloze.blankIndices));
    setShowRating(true);
  }, [cloze]);

  // Shared rating
  const handleRate = async (rating: Rating) => {
    if (!currentCard || isRating) return;
    setIsRating(true);

    const updatedSchedule = scheduleCard(currentCard.schedule, rating);
    try {
      await updateCardSchedule(currentCard.id, updatedSchedule);
    } catch {
      // Storage failure — continue review session
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) {
      setDone(true);
    } else {
      const nextCard = queue[nextIndex];
      setCurrentIndex(nextIndex);
      initCard(nextCard, difficultyRef.current);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────

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

  // ── Empty ─────────────────────────────────────────────────────────────────

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

  // ── Done ──────────────────────────────────────────────────────────────────

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

  if (!currentCard) return null;

  // ── Derived values ────────────────────────────────────────────────────────

  const referenceText = currentCard.endVerse
    ? formatReferenceRange(currentCard.book, currentCard.chapter, currentCard.verse, currentCard.endVerse)
    : formatReference(currentCard.book, currentCard.chapter, currentCard.verse);

  // Learning pass math
  const learningTotalPasses = 1 + Math.ceil(learningWordOrder.length / 2);
  const isLastLearningPass = learningPass === learningTotalPasses;
  const learningBlankCount = Math.min((learningPass - 1) * 2, learningWordOrder.length);
  const learningBlankSet = new Set(learningWordOrder.slice(0, learningBlankCount));
  const allLearningBlanksRevealed =
    learningPass >= 2 &&
    [...learningBlankSet].every(i => revealed.has(i)) &&
    refTopRevealed &&
    refBotRevealed;
  const shouldShowLearningRating = isLastLearningPass && allLearningBlanksRevealed;

  // Progress bar fill (0–100), learning mode only
  const progressPct = (learningTotalPasses > 1 ? (learningPass - 1) / (learningTotalPasses - 1) : 1) * 100;

  // Show upsell to free users reviewing a card that would have used Learning mode
  const showLearningUpsell = !isPro && cardMode === 'review' && getMasteryLevel(currentCard.schedule) === 'new';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Title row */}
      <View style={styles.titleRow}>
        <Text style={styles.screenTitle}>
          {cardMode === 'learning' ? Strings.learning.title : Strings.review.title}
        </Text>
        <TouchableOpacity
          style={styles.exitButton}
          onPress={handleExit}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={Strings.learning.exitButton}
        >
          <Ionicons name="close" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Card counter — shown for both modes */}
      <Text style={styles.counter}>
        {Strings.review.cardProgress(currentIndex + 1, queue.length)}
      </Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {cardMode === 'learning' ? (
          <LearningPassView
            referenceText={referenceText}
            pass={learningPass}
            totalPasses={learningTotalPasses}
            progressPct={progressPct}
            tokens={learningTokens}
            blankSet={learningBlankSet}
            revealed={revealed}
            refTopRevealed={refTopRevealed}
            refBotRevealed={refBotRevealed}
            isLastPass={isLastLearningPass}
            shouldShowRating={shouldShowLearningRating}
            isRating={isRating}
            onContinue={handleLearningContinue}
            onNextPass={handleNextPass}
            onRevealWord={handleRevealWordLearning}
            onRevealAll={handleRevealAllLearning}
            onRevealRefTop={() => setRefTopRevealed(true)}
            onRevealRefBot={() => setRefBotRevealed(true)}
            onRate={handleRate}
          />
        ) : (
          <ClozeReviewView
            referenceText={referenceText}
            cloze={cloze}
            revealed={revealed}
            showRating={showRating}
            isRating={isRating}
            showLearningUpsell={showLearningUpsell}
            onRevealBlank={handleRevealBlank}
            onRevealAll={handleRevealAll}
            onRate={handleRate}
            onOpenPaywall={openPaywall}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Learning Pass View ────────────────────────────────────────────────────────

interface LearningPassViewProps {
  referenceText: string;
  pass: number;
  totalPasses: number;
  progressPct: number;
  tokens: VerseToken[];
  blankSet: Set<number>;
  revealed: Set<number>;
  refTopRevealed: boolean;
  refBotRevealed: boolean;
  isLastPass: boolean;
  shouldShowRating: boolean;
  isRating: boolean;
  onContinue: () => void;
  onNextPass: () => void;
  onRevealWord: (index: number) => void;
  onRevealAll: () => void;
  onRevealRefTop: () => void;
  onRevealRefBot: () => void;
  onRate: (rating: Rating) => void;
}

function LearningPassView({
  referenceText, pass, totalPasses, progressPct, tokens, blankSet, revealed,
  refTopRevealed, refBotRevealed, isLastPass, shouldShowRating, isRating,
  onContinue, onNextPass, onRevealWord, onRevealAll,
  onRevealRefTop, onRevealRefBot, onRate,
}: LearningPassViewProps) {
  const showBlanks = pass > 1;

  return (
    <View>
      {/* Pass counter + progress bar */}
      <Text style={styles.passCounter}>
        {Strings.learning.passOf(pass, totalPasses)}
      </Text>
      <View style={styles.progressBarOuter}>
        <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
      </View>

      {/* Reference — top */}
      {(pass === 1 || refTopRevealed) ? (
        <Text style={styles.reference}>{referenceText}</Text>
      ) : (
        <TouchableOpacity
          onPress={onRevealRefTop}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={Strings.learning.referenceBlankLabel}
          style={styles.referenceBlankWrapper}
        >
          <Text style={styles.referenceBlankText}>
            {getBlankPlaceholder(referenceText)}
          </Text>
        </TouchableOpacity>
      )}

      {/* Verse card */}
      <View style={styles.card}>
        {!showBlanks ? (
          <Text style={styles.verseText}>
            {tokens.map(t => t.word + t.trailing).join('')}
          </Text>
        ) : (
          <ProgressiveVerseText
            tokens={tokens}
            blankSet={blankSet}
            revealed={revealed}
            onReveal={onRevealWord}
          />
        )}
      </View>

      {/* Reference — bottom */}
      {(pass === 1 || refBotRevealed) ? (
        <Text style={[styles.reference, styles.referenceBottom]}>{referenceText}</Text>
      ) : (
        <TouchableOpacity
          onPress={onRevealRefBot}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={Strings.learning.referenceBlankLabel}
          style={[styles.referenceBlankWrapper, styles.referenceBlankWrapperBottom]}
        >
          <Text style={styles.referenceBlankText}>
            {getBlankPlaceholder(referenceText)}
          </Text>
        </TouchableOpacity>
      )}

      {/* Pass 1 controls */}
      {pass === 1 && (
        <>
          <Text style={styles.hint}>{Strings.learning.instruction}</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onContinue}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>{Strings.learning.continueButton}</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Pass 2+ controls */}
      {showBlanks && !shouldShowRating && (
        <>
          <TouchableOpacity
            style={styles.revealButton}
            onPress={onRevealAll}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Text style={styles.revealButtonText}>{Strings.learning.revealAll}</Text>
          </TouchableOpacity>
          {!isLastPass && (
            <TouchableOpacity
              style={[styles.primaryButton, styles.nextPassButton]}
              onPress={onNextPass}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>{Strings.learning.nextPassButton}</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Rating — appears after final pass fully revealed */}
      {shouldShowRating && (
        <LearningRatingSection isRating={isRating} onRate={onRate} />
      )}
    </View>
  );
}

// ── Reference Blank ───────────────────────────────────────────────────────────
// Inline in LearningPassView above — no separate component needed.

// ── Progressive Verse Text ────────────────────────────────────────────────────

interface ProgressiveVerseTextProps {
  tokens: VerseToken[];
  blankSet: Set<number>;
  revealed: Set<number>;
  onReveal: (index: number) => void;
}

function ProgressiveVerseText({ tokens, blankSet, revealed, onReveal }: ProgressiveVerseTextProps) {
  return (
    <Text style={styles.verseText} accessibilityRole="text">
      {tokens.map((token) => {
        const isBlank = blankSet.has(token.index);
        const isRevealed = revealed.has(token.index);

        if (!isBlank) {
          return (
            <Text key={token.index} style={styles.verseWord}>
              {token.word}{token.trailing}
            </Text>
          );
        }

        if (isRevealed) {
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
            onPress={() => onReveal(token.index)}
            accessibilityRole="button"
            accessibilityLabel={Strings.review.blankAccessibility}
          >
            <Text style={styles.blank}>{getBlankPlaceholder(token.word)}</Text>
            <Text style={styles.verseWord}>{token.trailing}</Text>
          </Text>
        );
      })}
    </Text>
  );
}

// ── Cloze Review View ─────────────────────────────────────────────────────────

interface ClozeReviewViewProps {
  referenceText: string;
  cloze: ClozeResult | null;
  revealed: Set<number>;
  showRating: boolean;
  isRating: boolean;
  showLearningUpsell: boolean;
  onRevealBlank: (index: number) => void;
  onRevealAll: () => void;
  onRate: (rating: Rating) => void;
  onOpenPaywall: () => void;
}

function ClozeReviewView({
  referenceText, cloze, revealed, showRating, isRating,
  showLearningUpsell, onRevealBlank, onRevealAll, onRate, onOpenPaywall,
}: ClozeReviewViewProps) {
  return (
    <View>
      <Text style={styles.reference}>{referenceText}</Text>

      <View style={styles.card}>
        {cloze && (
          <ClozeText
            cloze={cloze}
            revealed={revealed}
            showRating={showRating}
            onRevealBlank={onRevealBlank}
          />
        )}
      </View>

      {!showRating && (
        <>
          <Text style={styles.hint}>
            {cloze && cloze.blankIndices.length > 0
              ? Strings.review.tapToReveal
              : Strings.review.tapToRevealAll}
          </Text>
          <TouchableOpacity
            style={styles.revealButton}
            onPress={onRevealAll}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={Strings.review.tapToRevealAll}
          >
            <Text style={styles.revealButtonText}>{Strings.review.tapToRevealAll}</Text>
          </TouchableOpacity>
        </>
      )}

      {showRating && <RatingSection isRating={isRating} onRate={onRate} />}

      {showRating && showLearningUpsell && (
        <TouchableOpacity
          style={styles.learningUpsell}
          onPress={onOpenPaywall}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={Strings.learning.upsellCta}
        >
          <Text style={styles.learningUpsellText}>{Strings.learning.upsellHint}</Text>
          <Text style={styles.learningUpsellCta}>{Strings.learning.upsellCta} →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Cloze Text ────────────────────────────────────────────────────────────────

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
            accessibilityLabel={Strings.review.blankAccessibility}
          >
            <Text style={styles.blank}>{getBlankPlaceholder(token.word)}</Text>
            <Text style={styles.verseWord}>{token.trailing}</Text>
          </Text>
        );
      })}
    </Text>
  );
}

// ── Learning Rating Section ───────────────────────────────────────────────────

interface LearningRatingSectionProps {
  isRating: boolean;
  onRate: (rating: Rating) => void;
}

function LearningRatingSection({ isRating, onRate }: LearningRatingSectionProps) {
  return (
    <View style={styles.learningRatingSection}>
      <TouchableOpacity
        style={[styles.reviewTomorrowButton, isRating && styles.ratingButtonDisabled]}
        onPress={() => onRate('good')}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={Strings.learning.reviewTomorrow}
        disabled={isRating}
      >
        <Text style={styles.reviewTomorrowText}>{Strings.learning.reviewTomorrow}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.learnAgainButton, isRating && styles.ratingButtonDisabled]}
        onPress={() => onRate('again')}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={Strings.learning.learnAgain}
        disabled={isRating}
      >
        <Text style={styles.learnAgainText}>{Strings.learning.learnAgain}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Rating Section ────────────────────────────────────────────────────────────

interface RatingSectionProps {
  isRating: boolean;
  onRate: (rating: Rating) => void;
}

function RatingSection({ isRating, onRate }: RatingSectionProps) {
  return (
    <View style={styles.ratingSection}>
      <Text style={styles.ratingLabel}>{Strings.review.rateYourRecall}</Text>
      <View style={styles.ratingButtons}>
        {RATING_BUTTONS.map(({ rating, label, hint, color }) => (
          <TouchableOpacity
            key={rating}
            style={[styles.ratingButton, { borderColor: color }, isRating && styles.ratingButtonDisabled]}
            onPress={() => onRate(rating)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${hint}`}
            disabled={isRating}
          >
            <Text style={[styles.ratingButtonLabel, { color }]}>{label}</Text>
            <Text style={styles.ratingButtonHint}>{hint}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

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

  // Title row
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  screenTitle: {
    flex: 1,
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    fontFamily: Fonts.sans,
  },
  exitButton: {
    width: TouchTarget,
    height: TouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Counter + progress bar
  counter: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    fontFamily: Fonts.sans,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },
  passCounter: {
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
    fontFamily: Fonts.sans,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
  progressBarOuter: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: Radii.full,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  progressFill: {
    height: 4,
    backgroundColor: Colors.accent,
    borderRadius: Radii.full,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
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
  referenceBottom: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },

  // Reference blank (learning mode)
  referenceBlankWrapper: {
    alignSelf: 'center',
    marginBottom: Spacing.lg,
    minHeight: TouchTarget,
    justifyContent: 'center',
  },
  referenceBlankWrapperBottom: {
    marginBottom: Spacing.xl,
    marginTop: Spacing.sm,
  },
  referenceBlankText: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.serif,
    color: Colors.blankUnderline,
    textDecorationLine: 'underline',
    letterSpacing: 4,
    fontWeight: FontWeights.bold,
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

  // Primary button (Continue / Next Pass)
  primaryButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    alignItems: 'center',
    minHeight: TouchTarget,
    justifyContent: 'center',
    ...Shadows.card,
  },
  primaryButtonText: {
    color: Colors.card,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    fontFamily: Fonts.sans,
  },
  nextPassButton: {
    marginTop: Spacing.sm,
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
  ratingButtonDisabled: {
    opacity: 0.4,
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

  // Learning rating
  learningRatingSection: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  reviewTomorrowButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    minHeight: TouchTarget,
    justifyContent: 'center',
    ...Shadows.card,
  },
  reviewTomorrowText: {
    color: Colors.card,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    fontFamily: Fonts.sans,
  },
  learnAgainButton: {
    borderWidth: 1.5,
    borderColor: Colors.destructive,
    borderRadius: Radii.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    minHeight: TouchTarget,
    justifyContent: 'center',
  },
  learnAgainText: {
    color: Colors.destructive,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    fontFamily: Fonts.sans,
  },

  // Learning upsell (free users on new cards)
  learningUpsell: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.accentLight,
    borderRadius: Radii.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    padding: Spacing.base,
    gap: Spacing.xs,
  },
  learningUpsellText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    fontFamily: Fonts.sans,
    lineHeight: 20,
  },
  learningUpsellCta: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.accent,
    fontFamily: Fonts.sans,
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
});
