/**
 * Deck Screen
 *
 * Free tier:  "All Verses" flat list (existing behaviour) + paywall prompt for
 *             named decks.
 * Pro tier:   Named decks + "All Verses" section below.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Colors, FontSizes, FontWeights, Fonts,
  Spacing, Radii, Shadows, TouchTarget,
} from '@/constants/theme';
import { Strings } from '@/constants/strings';
import {
  getDeckSortedByDue,
  loadDecks,
  createDeck,
  deleteDeck,
  type VerseCard,
  type Deck,
} from '@/utils/storage';
import { isDue } from '@/utils/sm2';
import { useProStatus } from '@/contexts/ProContext';

export default function DeckScreen() {
  const router = useRouter();
  const [cards, setCards] = useState<VerseCard[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const { isPro, openPaywall } = useProStatus();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [sorted, namedDecks] = await Promise.all([
        getDeckSortedByDue(),
        loadDecks(),
      ]);
      setCards(sorted);
      setDecks(namedDecks);
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

  const handleNewDeck = () => {
    if (isPro) {
      setNewDeckName('');
      setShowCreateDeck(true);
    } else {
      openPaywall();
    }
  };

  const handleCreateDeck = async () => {
    const name = newDeckName.trim();
    if (!name) return;
    await createDeck(name);
    setShowCreateDeck(false);
    loadData();
  };

  const handleDeleteDeck = (deck: Deck) => {
    Alert.alert(
      Strings.deck.deleteDeck,
      Strings.deck.deleteDeckMessage,
      [
        { text: Strings.common.back, style: 'cancel' },
        {
          text: Strings.deck.deleteDeckConfirm,
          style: 'destructive',
          onPress: async () => {
            await deleteDeck(deck.id);
            loadData();
          },
        },
      ],
    );
  };

  const allDueCount = cards.filter((c) => isDue(c.schedule)).length;
  const cardMap = new Map(cards.map((c) => [c.id, c]));

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

  const isEmpty = cards.length === 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{Strings.deck.title}</Text>
          {!isEmpty && (
            <Text style={styles.subtitle}>
              {Strings.deck.totalVerses(cards.length)}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.newDeckButton}
          onPress={handleNewDeck}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={Strings.deck.newDeck}
        >
          <Text style={styles.newDeckButtonText}>+ {Strings.deck.newDeck}</Text>
          {!isPro && <Text style={styles.proBadge}>{Strings.pro.badge}</Text>}
        </TouchableOpacity>
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
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.accent}
            />
          }
        >
          {/* All Verses — always present */}
          <DeckListRow
            name={Strings.deck.allVerses}
            verseCount={cards.length}
            dueCount={allDueCount}
            onPress={() => router.push('/deck/all')}
          />

          {/* Named decks (pro) */}
          {isPro && decks.map((d) => {
            const dueCount = d.cardIds
              .map((cid) => cardMap.get(cid))
              .filter((c): c is VerseCard => c !== undefined)
              .filter((c) => isDue(c.schedule)).length;
            return (
              <DeckListRow
                key={d.id}
                name={d.name}
                verseCount={d.cardIds.length}
                dueCount={dueCount}
                onPress={() => router.push(`/deck/${d.id}`)}
                onLongPress={() => handleDeleteDeck(d)}
              />
            );
          })}
        </ScrollView>
      )}

      {/* Create Deck Modal */}
      <Modal
        visible={showCreateDeck}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowCreateDeck(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{Strings.deck.newDeck}</Text>
            <Text style={styles.inputLabel}>{Strings.deck.deckNameLabel}</Text>
            <TextInput
              style={styles.deckNameInput}
              value={newDeckName}
              onChangeText={setNewDeckName}
              placeholder={Strings.deck.deckNamePlaceholder}
              placeholderTextColor={Colors.textTertiary}
              autoFocus
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleCreateDeck}
              selectionColor={Colors.accent}
            />
            <TouchableOpacity
              style={[styles.primaryButton, !newDeckName.trim() && styles.buttonDisabled]}
              onPress={handleCreateDeck}
              disabled={!newDeckName.trim()}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>{Strings.deck.createDeck}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ghostButton}
              onPress={() => setShowCreateDeck(false)}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Text style={styles.ghostButtonText}>{Strings.add.cancel}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ── DeckListRow ──────────────────────────────────────────────────────────────

interface DeckListRowProps {
  name: string;
  verseCount: number;
  dueCount: number;
  onPress: () => void;
  onLongPress?: () => void;
}

function DeckListRow({ name, verseCount, dueCount, onPress, onLongPress }: DeckListRowProps) {
  return (
    <TouchableOpacity
      style={styles.deckRow}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityHint={onLongPress ? 'Long press to delete' : undefined}
    >
      <View style={styles.deckRowContent}>
        <Text style={styles.deckRowName}>{name}</Text>
        <Text style={styles.deckRowMeta}>
          {Strings.deck.totalVerses(verseCount)}
          {dueCount > 0 ? `  ·  ${Strings.deck.dueCount(dueCount)}` : ''}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
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
  newDeckButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.full,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    minHeight: TouchTarget,
    justifyContent: 'center',
  },
  newDeckButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.accent,
    fontFamily: Fonts.sans,
  },
  proBadge: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: Colors.card,
    fontFamily: Fonts.sans,
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Radii.xs ?? 4,
    overflow: 'hidden',
  },

  // Scroll + list
  scroll: {
    flex: 1,
  },
  list: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl,
  },

  // Deck row
  deckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    marginBottom: Spacing.sm,
    minHeight: TouchTarget,
    ...Shadows.card,
  },
  deckRowContent: {
    flex: 1,
    gap: Spacing.xxs,
  },
  deckRowName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
    fontFamily: Fonts.sans,
  },
  deckRowMeta: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
  },
  chevron: {
    fontSize: FontSizes.lg,
    color: Colors.textTertiary,
    fontFamily: Fonts.sans,
    marginLeft: Spacing.sm,
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

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 28, 30, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    ...Shadows.elevated,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    fontFamily: Fonts.serif,
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
    marginBottom: Spacing.xs,
  },
  deckNameInput: {
    height: TouchTarget,
    backgroundColor: Colors.background,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.base,
    fontSize: FontSizes.base,
    fontFamily: Fonts.sans,
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: Colors.border,
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
  buttonDisabled: {
    opacity: 0.5,
  },
  ghostButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    minHeight: TouchTarget,
    justifyContent: 'center',
  },
  ghostButtonText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.base,
    fontFamily: Fonts.sans,
  },
});
