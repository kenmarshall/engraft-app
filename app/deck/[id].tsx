/**
 * Named Deck Detail Screen
 *
 * Shows all verses belonging to a specific named deck, sorted by due date.
 * Tapping a verse navigates to its verse detail screen.
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
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Colors, FontSizes, FontWeights, Fonts,
  Spacing, Radii, Shadows, TouchTarget,
} from '@/constants/theme';
import { Strings } from '@/constants/strings';
import {
  getDeckCards,
  loadDecks,
  deleteDeck,
  renameDeck,
  type VerseCard,
  type Deck,
} from '@/utils/storage';
import { formatReference, formatReferenceRange } from '@/utils/bible';
import { getMasteryLevel, formatDueDate, isDue } from '@/utils/sm2';
import { MasteryBadge } from '@/components/MasteryBadge';

export default function DeckDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();

  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<VerseCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [decks, deckCards] = await Promise.all([
        loadDecks(),
        getDeckCards(id),
      ]);
      const found = decks.find((d) => d.id === id) ?? null;
      setDeck(found);
      setCards(deckCards.sort((a, b) =>
        new Date(a.schedule.dueDate).getTime() - new Date(b.schedule.dueDate).getTime(),
      ));
      if (found) {
        navigation.setOptions({ title: found.name });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, navigation]);

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

  const handleDelete = () => {
    Alert.alert(
      Strings.deck.deleteDeck,
      Strings.deck.deleteDeckMessage,
      [
        { text: Strings.common.back, style: 'cancel' },
        {
          text: Strings.deck.deleteDeckConfirm,
          style: 'destructive',
          onPress: async () => {
            await deleteDeck(id);
            router.back();
          },
        },
      ],
    );
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

  if (!deck) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{Strings.common.error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isEmpty = cards.length === 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{deck.name}</Text>
          <Text style={styles.subtitle}>{Strings.deck.totalVerses(cards.length)}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={Strings.deck.deleteDeck}
        >
          <Text style={styles.deleteButtonText}>{Strings.deck.deleteDeck}</Text>
        </TouchableOpacity>
      </View>

      {isEmpty ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{Strings.deck.emptyDeckTitle}</Text>
          <Text style={styles.emptyBody}>{Strings.deck.emptyDeckBody}</Text>
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
          data={cards}
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
            <DeckRow
              card={item}
              onPress={() => router.push(`/verse/${item.id}`)}
            />
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
      accessibilityLabel={`${card.endVerse ? formatReferenceRange(card.book, card.chapter, card.verse, card.endVerse) : formatReference(card.book, card.chapter, card.verse)}, ${Strings.mastery[mastery]}`}
    >
      <View style={styles.rowLeft}>
        <Text style={styles.rowRef}>
          {card.endVerse
            ? formatReferenceRange(card.book, card.chapter, card.verse, card.endVerse)
            : formatReference(card.book, card.chapter, card.verse)}
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
  errorText: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
  },

  // Header
  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    marginTop: Spacing.xxs,
  },
  deleteButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: TouchTarget,
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.destructive,
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
