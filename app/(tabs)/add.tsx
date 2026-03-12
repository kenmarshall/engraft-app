/**
 * Add Verse Screen
 *
 * Allows the user to search for a KJV verse by reference (e.g. "John 3:16"),
 * a verse range (e.g. "John 3:1-5"), or a whole chapter (e.g. "Psalms 23"),
 * preview the text, and add it to their deck.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Colors, FontSizes, FontWeights, Fonts,
  Spacing, Radii, Shadows, TouchTarget,
} from '@/constants/theme';
import { Strings } from '@/constants/strings';
import {
  searchByReference,
  parseRangeReference,
  lookupChapter,
  lookupRange,
  formatReference,
  formatReferenceRange,
  suggestBooks,
  type KJVVerse,
} from '@/utils/bible';
import { BookSuggestions } from '@/components/BookSuggestions';
import { addCard, isInDeck, makeCardId, makeRangeCardId, addCardToDeck, loadDecks, type Deck } from '@/utils/storage';
import { useProStatus } from '@/contexts/ProContext';

type SearchState =
  | 'idle'
  | 'searching'
  | 'found'
  | 'foundRange'
  | 'rangeGated'
  | 'notFound'
  | 'alreadyAdded'
  | 'added'
  | 'addedRange';

export default function AddVerseScreen() {
  const { isPro, openPaywall } = useProStatus();
  const [query, setQuery] = useState('');
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [foundVerse, setFoundVerse] = useState<KJVVerse | null>(null);
  const [foundVerses, setFoundVerses] = useState<KJVVerse[]>([]);
  const [addedCount, setAddedCount] = useState(0);
  const [namedDecks, setNamedDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isPro) {
      loadDecks().then(setNamedDecks).catch(() => {});
    }
  }, [isPro]);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setSearchState('searching');
    setFoundVerse(null);
    setFoundVerses([]);

    // Simulate a brief async tick so the loading spinner renders
    await new Promise((resolve) => setTimeout(resolve, 120));

    // 1. Try single verse
    const verse = searchByReference(trimmed);
    if (verse) {
      const cardId = makeCardId(verse.book, verse.chapter, verse.verse);
      const alreadyIn = await isInDeck(cardId);
      setFoundVerse(verse);
      setSearchState(alreadyIn ? 'alreadyAdded' : 'found');
      return;
    }

    // 2. Try range / chapter (Pro feature)
    const rangeRef = parseRangeReference(trimmed);
    if (rangeRef) {
      if (!isPro) {
        setSearchState('rangeGated');
        return;
      }

      const verses =
        rangeRef.verseStart !== undefined
          ? lookupRange(rangeRef.book, rangeRef.chapter, rangeRef.verseStart, rangeRef.verseEnd!)
          : lookupChapter(rangeRef.book, rangeRef.chapter);

      if (verses.length > 0) {
        setFoundVerses(verses);
        setSearchState('foundRange');
        return;
      }
    }

    setSearchState('notFound');
  };

  const handleAdd = async () => {
    if (!foundVerse) return;
    const cardId = makeCardId(foundVerse.book, foundVerse.chapter, foundVerse.verse);
    try {
      await addCard({
        id: cardId,
        book: foundVerse.book,
        chapter: foundVerse.chapter,
        verse: foundVerse.verse,
        text: foundVerse.text,
      });
      if (selectedDeckId) {
        await addCardToDeck(selectedDeckId, cardId);
      }
      setSearchState('added');
    } catch {
      // Storage failure — remain on 'found' state so user can retry
    }
  };

  const handleAddRange = async () => {
    if (foundVerses.length === 0) return;
    const first = foundVerses[0];
    const last = foundVerses[foundVerses.length - 1];
    const passageId = makeRangeCardId(first.book, first.chapter, first.verse, last.verse);
    const passageText = foundVerses.map((v) => v.text).join(' ');

    const alreadyIn = await isInDeck(passageId);
    const count = alreadyIn ? 0 : 1;

    if (!alreadyIn) {
      await addCard({
        id: passageId,
        book: first.book,
        chapter: first.chapter,
        verse: first.verse,
        endVerse: last.verse,
        text: passageText,
      });
    }

    if (selectedDeckId) {
      await addCardToDeck(selectedDeckId, passageId);
    }

    setAddedCount(count);
    setSearchState('addedRange');
  };

  const handleBookSelect = (book: string) => {
    setQuery(`${book} `);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleReset = () => {
    setQuery('');
    setSearchState('idle');
    setFoundVerse(null);
    setFoundVerses([]);
    setSelectedDeckId(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text style={styles.title}>{Strings.add.title}</Text>

          {/* Search Input */}
          <View style={styles.searchRow}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              placeholder={Strings.add.searchPlaceholder}
              placeholderTextColor={Colors.textTertiary}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
              autoCorrect={false}
              autoCapitalize="words"
              accessibilityLabel={Strings.add.searchPlaceholder}
              selectionColor={Colors.accent}
            />
            <TouchableOpacity
              style={[
                styles.searchButton,
                (searchState === 'searching' || !query.trim()) && styles.searchButtonDisabled,
              ]}
              onPress={handleSearch}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={Strings.add.searchButton}
              disabled={searchState === 'searching' || !query.trim()}
            >
              {searchState === 'searching' ? (
                <ActivityIndicator color={Colors.card} size="small" />
              ) : (
                <Text style={styles.searchButtonText}>{Strings.add.searchButton}</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Book autocomplete — show while user is still typing the book (no colon yet) */}
          {searchState === 'idle' && !query.includes(':') && (
            <BookSuggestions
              suggestions={suggestBooks(query.trim())}
              onSelect={handleBookSelect}
            />
          )}

          {/* Hint */}
          {searchState === 'idle' && (
            <Text style={styles.hint}>{Strings.add.searchHint}</Text>
          )}

          {/* Range Gated — Pro feature paywall */}
          {searchState === 'rangeGated' && (
            <View style={styles.gatedBox}>
              <Text style={styles.gatedTitle}>{Strings.add.rangeGatedTitle}</Text>
              <Text style={styles.gatedBody}>{Strings.add.rangeGatedBody}</Text>
              <TouchableOpacity
                onPress={openPaywall}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={Strings.pro.paywallAction}
              >
                <Text style={styles.gatedCta}>{Strings.pro.paywallAction} →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Not Found */}
          {searchState === 'notFound' && (
            <View style={styles.notFoundBox}>
              <Text style={styles.notFoundTitle}>{Strings.add.notFound}</Text>
              <Text style={styles.notFoundBody}>{Strings.add.notFoundBody}</Text>
            </View>
          )}

          {/* Already Added */}
          {searchState === 'alreadyAdded' && foundVerse && (
            <>
              <VersePreviewCard verse={foundVerse} />
              <View style={styles.alreadyBadge}>
                <Text style={styles.alreadyText}>{Strings.add.alreadyAdded}</Text>
              </View>
            </>
          )}

          {/* Found single — confirm add */}
          {searchState === 'found' && foundVerse && (
            <>
              <Text style={styles.previewLabel}>{Strings.add.preview}</Text>
              <VersePreviewCard verse={foundVerse} />
              {isPro && namedDecks.length > 0 && (
                <DeckSelector
                  decks={namedDecks}
                  selectedId={selectedDeckId}
                  onSelect={setSelectedDeckId}
                />
              )}
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAdd}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={Strings.add.addToMemory}
              >
                <Text style={styles.addButtonText}>{Strings.add.addToMemory}</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Found range — confirm batch add */}
          {searchState === 'foundRange' && foundVerses.length > 0 && (
            <>
              <Text style={styles.previewLabel}>{Strings.add.preview}</Text>
              <RangePreviewCard verses={foundVerses} />
              {isPro && namedDecks.length > 0 && (
                <DeckSelector
                  decks={namedDecks}
                  selectedId={selectedDeckId}
                  onSelect={setSelectedDeckId}
                />
              )}
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddRange}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={Strings.add.confirmRange(foundVerses.length)}
              >
                <Text style={styles.addButtonText}>
                  {Strings.add.confirmRange(foundVerses.length)}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Success — single */}
          {searchState === 'added' && foundVerse && (
            <>
              <VersePreviewCard verse={foundVerse} />
              <View style={styles.successBox}>
                <Text style={styles.successText}>{Strings.add.added}</Text>
              </View>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleReset}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryButtonText}>{Strings.add.addAnother}</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Success — range */}
          {searchState === 'addedRange' && (
            <>
              <View style={styles.successBox}>
                <Text style={styles.successText}>
                  {Strings.add.addedMultiple(addedCount)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleReset}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryButtonText}>{Strings.add.addAnother}</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── VersePreviewCard ────────────────────────────────────────────────────────

function VersePreviewCard({ verse }: { verse: KJVVerse }) {
  return (
    <View style={styles.previewCard}>
      <Text style={styles.previewRef}>
        {formatReference(verse.book, verse.chapter, verse.verse)}
      </Text>
      <Text style={styles.previewText}>{verse.text}</Text>
    </View>
  );
}

// ── RangePreviewCard ────────────────────────────────────────────────────────

function RangePreviewCard({ verses }: { verses: KJVVerse[] }) {
  const first = verses[0];
  const last = verses[verses.length - 1];
  const rangeLabel = formatReferenceRange(first.book, first.chapter, first.verse, last.verse);

  return (
    <View style={styles.previewCard}>
      <Text style={styles.previewRef}>{rangeLabel}</Text>
      <Text style={styles.rangeCount}>{Strings.add.verseCount(verses.length)}</Text>
      {verses.map((v) => (
        <View key={makeVerseKey(v)} style={styles.rangeVerseRow}>
          <Text style={styles.rangeVerseRef}>
            {v.chapter}:{v.verse}
          </Text>
          <Text style={styles.rangeVerseText} numberOfLines={2}>
            {v.text}
          </Text>
        </View>
      ))}
    </View>
  );
}

function makeVerseKey(v: KJVVerse): string {
  return `${v.book}-${v.chapter}-${v.verse}`;
}

// ── DeckSelector ────────────────────────────────────────────────────────────

interface DeckSelectorProps {
  decks: Deck[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

function DeckSelector({ decks, selectedId, onSelect }: DeckSelectorProps) {
  return (
    <View style={styles.deckSelectorContainer}>
      <Text style={styles.deckSelectorLabel}>{Strings.deck.newDeck.replace('New ', 'Add to ')}</Text>
      <View style={styles.deckSelectorRow}>
        <TouchableOpacity
          style={[styles.deckChip, selectedId === null && styles.deckChipSelected]}
          onPress={() => onSelect(null)}
          activeOpacity={0.7}
          accessibilityRole="button"
        >
          <Text style={[styles.deckChipText, selectedId === null && styles.deckChipTextSelected]}>
            {Strings.deck.allVerses}
          </Text>
        </TouchableOpacity>
        {decks.map((d) => (
          <TouchableOpacity
            key={d.id}
            style={[styles.deckChip, selectedId === d.id && styles.deckChipSelected]}
            onPress={() => onSelect(selectedId === d.id ? null : d.id)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={d.name}
          >
            <Text style={[styles.deckChipText, selectedId === d.id && styles.deckChipTextSelected]}>
              {d.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },

  // Title
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    fontFamily: Fonts.serif,
    marginBottom: Spacing.xl,
  },

  // Search
  searchRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  input: {
    flex: 1,
    height: TouchTarget,
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.base,
    fontSize: FontSizes.base,
    fontFamily: Fonts.sans,
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  searchButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.lg,
    height: TouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchButtonText: {
    color: Colors.card,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    fontFamily: Fonts.sans,
  },

  // Hint
  hint: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: Spacing.lg,
  },

  // Preview
  previewLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
    fontWeight: FontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  previewCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.xl,
    ...Shadows.elevated,
    marginBottom: Spacing.lg,
  },
  previewRef: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.accent,
    fontFamily: Fonts.sans,
    marginBottom: Spacing.md,
  },
  previewText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.serif,
    color: Colors.text,
    lineHeight: 28,
  },

  // Range preview
  rangeCount: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
    marginBottom: Spacing.md,
  },
  rangeVerseRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  rangeVerseRef: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.accent,
    fontFamily: Fonts.sans,
    width: 36,
    paddingTop: 2,
  },
  rangeVerseText: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.serif,
    color: Colors.text,
    lineHeight: 20,
  },

  // Deck selector
  deckSelectorContainer: {
    marginBottom: Spacing.md,
  },
  deckSelectorLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  deckSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  deckChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    minHeight: 32,
    justifyContent: 'center',
  },
  deckChipSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight,
  },
  deckChipText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.sans,
    color: Colors.textSecondary,
  },
  deckChipTextSelected: {
    color: Colors.accent,
    fontWeight: FontWeights.semibold,
  },

  // Add button
  addButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    minHeight: TouchTarget,
    justifyContent: 'center',
    ...Shadows.card,
  },
  addButtonText: {
    color: Colors.card,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    fontFamily: Fonts.sans,
  },

  // Secondary button
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: Colors.accent,
    borderRadius: Radii.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    minHeight: TouchTarget,
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  secondaryButtonText: {
    color: Colors.accent,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    fontFamily: Fonts.sans,
  },

  // Range gated (Pro paywall)
  gatedBox: {
    backgroundColor: Colors.accentLight,
    borderRadius: Radii.md,
    padding: Spacing.base,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  gatedTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.accent,
    fontFamily: Fonts.sans,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gatedBody: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    fontFamily: Fonts.sans,
    lineHeight: 20,
  },
  gatedCta: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.accent,
    fontFamily: Fonts.sans,
    marginTop: Spacing.xs,
  },

  // Not Found
  notFoundBox: {
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    padding: Spacing.base,
    borderLeftWidth: 3,
    borderLeftColor: Colors.destructive,
    marginTop: Spacing.lg,
  },
  notFoundTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.destructive,
    fontFamily: Fonts.sans,
    marginBottom: Spacing.xs,
  },
  notFoundBody: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
    lineHeight: 20,
  },

  // Already added
  alreadyBadge: {
    backgroundColor: Colors.accentLight,
    borderRadius: Radii.md,
    padding: Spacing.base,
    alignItems: 'center',
  },
  alreadyText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    color: Colors.accent,
    fontFamily: Fonts.sans,
  },

  // Success
  successBox: {
    backgroundColor: Colors.successLight,
    borderRadius: Radii.md,
    padding: Spacing.base,
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
  },
  successText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    color: Colors.success,
    fontFamily: Fonts.sans,
  },
});
