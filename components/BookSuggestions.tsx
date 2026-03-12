import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  Colors, FontSizes, FontWeights, Fonts,
  Spacing, Radii, Shadows, TouchTarget,
} from '@/constants/theme';

interface BookSuggestionsProps {
  suggestions: string[];
  onSelect: (book: string) => void;
}

export function BookSuggestions({ suggestions, onSelect }: BookSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <View style={styles.container}>
      {suggestions.map((book, index) => (
        <TouchableOpacity
          key={book}
          style={[
            styles.row,
            index === suggestions.length - 1 && styles.rowLast,
          ]}
          onPress={() => onSelect(book)}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel={book}
        >
          <Text style={styles.bookName}>{book}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.elevated,
  },
  row: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    minHeight: TouchTarget,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  bookName: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.sans,
    fontWeight: FontWeights.medium,
    color: Colors.text,
  },
});
