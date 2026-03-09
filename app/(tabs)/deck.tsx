/**
 * Deck Screen
 *
 * Shows all verses in the user's deck with:
 * - Mastery level badge (New / Learning / Mature)
 * - Next review date
 * - Tap to navigate to verse detail
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Colors, FontSizes, FontWeights, Fonts,
  Spacing, Radii, Shadows, TouchTarget,
} from '@/constants/theme';
import { Strings } from '@/constants/strings';
import { getDeckSortedByDue, type VerseCard } from '@/utils/storage';
import { formatReference } from '@/utils/bible';
import { getMasteryLevel, formatDueDate, isDue } from '@/utils/sm2';
import { MasteryBadge } from '@/components/MasteryBadge';

export default function DeckScreen() {
  const router = useRouter();
  const [deck, setDeck] = useState<VerseCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const sorted = await getDeckSortedByDue();
      setDeck(sorted);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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

  const handleVersePress = (card: VerseCard) => {
    router.push(`/verse/${card.id}`);
  };

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

  const isEmpty = deck.length === 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{Strings.deck.title}</Text>
        {!isEmpty && (
          <Text style={styles.subtitle}>
            {Strings.deck.totalVerses(deck.length)}
          </Text>
        )}
      </View>

      {isEmpty ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{Strings.deck.emptyTitle}</Text>
          <Text style={styles.emptyBody}>{Strings.deck.emptyBody}</Text>
          <TouchableOpacity
            style={styles.emptyAction}
            onPress={() => router.push('/(tabs)/add')}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Text style={styles.emptyActionText}>{Strings.deck.emptyAction}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={deck}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.accent}
            />
          }
          renderItem={({ item }) => (
            <DeckRow card={item} onPress={() => handleVersePress(item)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ── DeckRow ─────────────────────────────────────────────────────────────────

interface DeckRowProps {
  card: VerseCard;
  onPress: () => void;
}

function DeckRow({ card, onPress }: DeckRowProps) {
  const mastery = getMasteryLevel(card.schedule);
  const due = isDue(card.schedule);
  const dueDateLabel = formatDueDate(card.schedule.dueDate);

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${formatReference(card.book, card.chapter, card.verse)}, ${Strings.mastery[mastery]}`}
    >
      <View style={styles.rowLeft}>
        <Text style={styles.rowRef}>
          {formatReference(card.book, card.chapter, card.verse)}
        </Text>
        <Text style={styles.rowText} numberOfLines={2}>
          {card.text}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <MasteryBadge level={mastery} />
        <Text style={[styles.rowDue, due && styles.rowDueNow]}>
          {due ? Strings.deck.dueNow : dueDateLabel}
        </Text>
      </View>
    </TouchableOpacity>
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
  },
  loadingText: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
  },

  // Header
  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    fontFamily: Fonts.serif,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
  },

  // List
  list: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxxl,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
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
  emptyAction: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    minHeight: TouchTarget,
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  emptyActionText: {
    color: Colors.card,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    fontFamily: Fonts.sans,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    minHeight: TouchTarget,
    ...Shadows.card,
  },
  rowLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  rowRef: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
    fontFamily: Fonts.sans,
    marginBottom: Spacing.xs,
  },
  rowText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontFamily: Fonts.serif,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
    paddingTop: Spacing.xxs,
  },
  rowDue: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    fontFamily: Fonts.sans,
    marginTop: Spacing.xs,
  },
  rowDueNow: {
    color: Colors.accent,
    fontWeight: FontWeights.semibold,
  },
});
