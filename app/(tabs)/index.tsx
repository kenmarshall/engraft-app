/**
 * Home Screen
 *
 * Shows:
 * - Cards due today count with a quick-start review button
 * - Recent verses added to the deck
 * - Empty state when no verses exist
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, FontSizes, FontWeights, Fonts, Spacing, Radii, Shadows, TouchTarget } from '@/constants/theme';
import { Strings } from '@/constants/strings';
import { loadDeck, getDueCards, type VerseCard } from '@/utils/storage';
import { formatReference } from '@/utils/bible';
import { getMasteryLevel, formatDueDate } from '@/utils/sm2';
import { MasteryBadge } from '@/components/MasteryBadge';

export default function HomeScreen() {
  const router = useRouter();
  const [deck, setDeck] = useState<VerseCard[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [allCards, dueCards] = await Promise.all([
        loadDeck(),
        getDueCards(),
      ]);
      setDeck(allCards.slice().reverse()); // Most recent first
      setDueCount(dueCards.length);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Reload on every focus (e.g. after adding a verse)
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleStartReview = () => {
    router.push('/(tabs)/review');
  };

  const handleAddVerse = () => {
    router.push('/(tabs)/add');
  };

  const handleVersePress = (card: VerseCard) => {
    router.push(`/verse/${card.id}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.accent} size="large" />
          <Text style={styles.loadingText}>{Strings.common.loading}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasDeck = deck.length > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>{Strings.appName}</Text>
          <Text style={styles.tagline}>{Strings.tagline}</Text>
        </View>

        {/* Due Today Card */}
        <View style={[styles.dueCard, dueCount === 0 && styles.dueCardEmpty]}>
          <Text style={[styles.dueLabel, dueCount === 0 && styles.dueLabelEmpty]}>
            {Strings.home.dueToday}
          </Text>
          <Text style={[styles.dueCount, dueCount === 0 && styles.dueCountEmpty]}>
            {hasDeck ? Strings.home.dueCard(dueCount) : '–'}
          </Text>

          {hasDeck && dueCount > 0 && (
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartReview}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={Strings.home.startReview}
            >
              <Text style={styles.startButtonText}>{Strings.home.startReview}</Text>
            </TouchableOpacity>
          )}

          {hasDeck && dueCount === 0 && (
            <Text style={styles.caughtUpBody}>{Strings.home.noDueCardsBody}</Text>
          )}
        </View>

        {/* Verse list or Empty State */}
        {!hasDeck ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{Strings.home.emptyTitle}</Text>
            <Text style={styles.emptyBody}>{Strings.home.emptyBody}</Text>
            <TouchableOpacity
              style={styles.emptyAction}
              onPress={handleAddVerse}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={styles.emptyActionText}>{Strings.home.emptyAction}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>{Strings.home.recentVerses}</Text>
            {deck.slice(0, 10).map((card) => (
              <TouchableOpacity
                key={card.id}
                style={styles.verseRow}
                onPress={() => handleVersePress(card)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={formatReference(card.book, card.chapter, card.verse)}
              >
                <View style={styles.verseRowLeft}>
                  <Text style={styles.verseRef}>
                    {formatReference(card.book, card.chapter, card.verse)}
                  </Text>
                  <Text style={styles.versePreview} numberOfLines={2}>
                    {card.text}
                  </Text>
                </View>
                <View style={styles.verseRowRight}>
                  <MasteryBadge level={getMasteryLevel(card.schedule)} />
                  <Text style={styles.dueDateText}>
                    {formatDueDate(card.schedule.dueDate)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxxl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
  },

  // Header
  header: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  appName: {
    fontSize: FontSizes.display,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    fontFamily: Fonts.serif,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
    marginTop: Spacing.xxs,
    fontStyle: 'italic',
  },

  // Due Card
  dueCard: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  dueCardEmpty: {
    backgroundColor: Colors.accentLight,
  },
  dueLabel: {
    fontSize: FontSizes.xs,
    color: Colors.card,
    fontFamily: Fonts.sans,
    fontWeight: FontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.85,
  },
  dueLabelEmpty: {
    color: Colors.accent,
    opacity: 1,
  },
  dueCount: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.card,
    fontFamily: Fonts.sans,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  dueCountEmpty: {
    color: Colors.accent,
  },
  startButton: {
    backgroundColor: Colors.card,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.full,
    alignSelf: 'flex-start',
    minHeight: TouchTarget,
    justifyContent: 'center',
  },
  startButtonText: {
    color: Colors.accent,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    fontFamily: Fonts.sans,
  },
  caughtUpBody: {
    fontSize: FontSizes.sm,
    color: Colors.accent,
    fontFamily: Fonts.sans,
    opacity: 0.8,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
    fontFamily: Fonts.serif,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  emptyBody: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  emptyAction: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: Radii.full,
    minHeight: TouchTarget,
    justifyContent: 'center',
  },
  emptyActionText: {
    color: Colors.card,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    fontFamily: Fonts.sans,
  },

  // Section
  sectionTitle: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: Fonts.sans,
    marginBottom: Spacing.md,
  },

  // Verse Row
  verseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    minHeight: TouchTarget,
    ...Shadows.card,
  },
  verseRowLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  verseRef: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
    fontFamily: Fonts.sans,
    marginBottom: Spacing.xs,
  },
  versePreview: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontFamily: Fonts.serif,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  verseRowRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  dueDateText: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    fontFamily: Fonts.sans,
    marginTop: Spacing.xs,
  },
});
