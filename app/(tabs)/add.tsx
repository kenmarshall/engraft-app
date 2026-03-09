/**
 * Add Verse Screen
 *
 * Allows the user to search for a KJV verse by reference (e.g. "John 3:16"),
 * preview the text, and add it to their deck.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Colors, FontSizes, FontWeights, Fonts,
  Spacing, Radii, Shadows, TouchTarget,
} from '@/constants/theme';
import { Strings } from '@/constants/strings';
import { searchByReference, formatReference, type KJVVerse } from '@/utils/bible';
import { addCard, isInDeck, makeCardId } from '@/utils/storage';

type SearchState = 'idle' | 'searching' | 'found' | 'notFound' | 'alreadyAdded' | 'added';

export default function AddVerseScreen() {
  const [query, setQuery] = useState('');
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [foundVerse, setFoundVerse] = useState<KJVVerse | null>(null);
  const inputRef = useRef<TextInput>(null);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setSearchState('searching');
    setFoundVerse(null);

    // Simulate a brief async tick so the loading spinner renders
    await new Promise((resolve) => setTimeout(resolve, 120));

    const verse = searchByReference(trimmed);

    if (!verse) {
      setSearchState('notFound');
      return;
    }

    const cardId = makeCardId(verse.book, verse.chapter, verse.verse);
    const alreadyIn = await isInDeck(cardId);

    if (alreadyIn) {
      setFoundVerse(verse);
      setSearchState('alreadyAdded');
      return;
    }

    setFoundVerse(verse);
    setSearchState('found');
  };

  const handleAdd = async () => {
    if (!foundVerse) return;

    const cardId = makeCardId(foundVerse.book, foundVerse.chapter, foundVerse.verse);
    await addCard({
      id: cardId,
      book: foundVerse.book,
      chapter: foundVerse.chapter,
      verse: foundVerse.verse,
      text: foundVerse.text,
    });

    setSearchState('added');
  };

  const handleReset = () => {
    setQuery('');
    setSearchState('idle');
    setFoundVerse(null);
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
              style={styles.searchButton}
              onPress={handleSearch}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Search"
              disabled={searchState === 'searching' || !query.trim()}
            >
              {searchState === 'searching' ? (
                <ActivityIndicator color={Colors.card} size="small" />
              ) : (
                <Text style={styles.searchButtonText}>Search</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Hint */}
          {searchState === 'idle' && (
            <Text style={styles.hint}>{Strings.add.searchHint}</Text>
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

          {/* Found — confirm add */}
          {searchState === 'found' && foundVerse && (
            <>
              <Text style={styles.previewLabel}>{Strings.add.preview}</Text>
              <VersePreviewCard verse={foundVerse} />
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

          {/* Success */}
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
                <Text style={styles.secondaryButtonText}>Add Another Verse</Text>
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
    backgroundColor: '#EAF7EA',
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
