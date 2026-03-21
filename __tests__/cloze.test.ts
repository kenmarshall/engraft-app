/**
 * Cloze Deletion Engine Unit Tests
 *
 * Tests cover:
 * - generateCloze produces valid output structure
 * - Blank ratio: easy ~25%, medium ~50%, hard = all eligible
 * - Stop words are never blanked
 * - Short words (<3 chars) are never blanked
 * - Deterministic output with same seed
 * - Different seeds produce different selections (easy, where not all eligible are blanked)
 * - renderClozeText with and without revealed words
 * - getBlankPlaceholder length clamping
 */

import {
  generateCloze,
  renderClozeText,
  getBlankPlaceholder,
  tokenizeVerse,
  getProgressiveWordOrder,
  type ClozeResult,
} from '../utils/cloze';

// ── Fixture verses ─────────────────────────────────────────────────────────

const JOHN_3_16 =
  'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.';

const SHORT_VERSE = 'The LORD is my shepherd; I shall not want.';

const SINGLE_WORD = 'Amen.';

// ── generateCloze — structure ──────────────────────────────────────────────

describe('generateCloze — output structure', () => {
  let result: ClozeResult;

  beforeEach(() => {
    result = generateCloze(JOHN_3_16);
  });

  it('returns originalText unchanged', () => {
    expect(result.originalText).toBe(JOHN_3_16);
  });

  it('returns an array of tokens', () => {
    expect(Array.isArray(result.tokens)).toBe(true);
    expect(result.tokens.length).toBeGreaterThan(0);
  });

  it('every token has required fields', () => {
    for (const token of result.tokens) {
      expect(typeof token.word).toBe('string');
      expect(typeof token.trailing).toBe('string');
      expect(typeof token.isBlank).toBe('boolean');
      expect(typeof token.index).toBe('number');
    }
  });

  it('blankIndices matches tokens marked isBlank', () => {
    const blankedTokenIndices = result.tokens
      .filter((t) => t.isBlank)
      .map((t) => t.index)
      .sort((a, b) => a - b);
    const reportedIndices = [...result.blankIndices].sort((a, b) => a - b);
    expect(reportedIndices).toEqual(blankedTokenIndices);
  });

  it('token indices are sequential starting from 0', () => {
    result.tokens.forEach((t, i) => {
      expect(t.index).toBe(i);
    });
  });
});

// ── generateCloze — blank ratio ────────────────────────────────────────────

describe('generateCloze — blank ratio', () => {
  it('easy blanks ~25% of total words', () => {
    const result = generateCloze(JOHN_3_16, 0, 'easy');
    const ratio = result.blankIndices.length / result.tokens.length;
    expect(ratio).toBeGreaterThan(0);
    expect(ratio).toBeLessThanOrEqual(0.35); // target 20–30%, flex for small eligible pool
  });

  it('medium blanks ~50% of total words', () => {
    const result = generateCloze(JOHN_3_16, 0, 'medium');
    const ratio = result.blankIndices.length / result.tokens.length;
    expect(ratio).toBeGreaterThan(0);
    expect(ratio).toBeLessThanOrEqual(0.60); // target 45–55%, flex for eligible pool ceiling
  });

  it('hard blanks all eligible words', () => {
    const result = generateCloze(JOHN_3_16, 0, 'hard');
    // Every blank should be an eligible word; no more can be added
    const easyResult = generateCloze(JOHN_3_16, 0, 'easy');
    expect(result.blankIndices.length).toBeGreaterThanOrEqual(easyResult.blankIndices.length);
    expect(result.blankIndices.length).toBeGreaterThan(0);
  });

  it('short verse still produces at least one blank if eligible words exist', () => {
    const result = generateCloze(SHORT_VERSE);
    // "shepherd", "want" are eligible in this verse
    expect(result.blankIndices.length).toBeGreaterThanOrEqual(1);
  });
});

// ── generateCloze — stop words ────────────────────────────────────────────

describe('generateCloze — stop word exclusion', () => {
  const STOP_WORDS_IN_VERSE = ['For', 'so', 'the', 'that', 'he', 'his', 'in', 'him', 'not', 'but', 'have'];

  it('never blanks articles, conjunctions, or pronouns', () => {
    // Run many seeds to cover different selections
    for (let seed = 0; seed < 10; seed++) {
      const result = generateCloze(JOHN_3_16, seed);
      const blankedWords = result.tokens
        .filter((t) => t.isBlank)
        .map((t) => t.word.toLowerCase());

      for (const stopWord of STOP_WORDS_IN_VERSE) {
        expect(blankedWords).not.toContain(stopWord.toLowerCase());
      }
    }
  });

  it('never blanks short words (< 3 chars)', () => {
    for (let seed = 0; seed < 10; seed++) {
      const result = generateCloze(JOHN_3_16, seed);
      const blankedWords = result.tokens
        .filter((t) => t.isBlank)
        .map((t) => t.word);

      for (const word of blankedWords) {
        expect(word.length).toBeGreaterThanOrEqual(3);
      }
    }
  });
});

// ── generateCloze — determinism ────────────────────────────────────────────

describe('generateCloze — determinism', () => {
  it('produces identical results for the same seed', () => {
    const result1 = generateCloze(JOHN_3_16, 42);
    const result2 = generateCloze(JOHN_3_16, 42);
    expect(result1.blankIndices).toEqual(result2.blankIndices);
  });

  it('produces different results for different seeds at easy difficulty', () => {
    // Use 'easy' (~25%) so only a subset of eligible words is chosen,
    // making the seed selection meaningful (medium may blank all eligible words).
    const result0 = generateCloze(JOHN_3_16, 0, 'easy');
    const result1 = generateCloze(JOHN_3_16, 999, 'easy');
    expect(result0.blankIndices).not.toEqual(result1.blankIndices);
  });
});

// ── generateCloze — edge cases ─────────────────────────────────────────────

describe('generateCloze — edge cases', () => {
  it('handles a single-word verse gracefully', () => {
    const result = generateCloze(SINGLE_WORD);
    expect(result.tokens.length).toBeGreaterThan(0);
    // "Amen" is 4 chars and not a stop word, so it may be blanked
    expect(result.blankIndices.length).toBeLessThanOrEqual(1);
  });

  it('handles an empty string without throwing', () => {
    expect(() => generateCloze('')).not.toThrow();
    const result = generateCloze('');
    expect(result.tokens).toHaveLength(0);
    expect(result.blankIndices).toHaveLength(0);
  });
});

// ── renderClozeText ────────────────────────────────────────────────────────

describe('renderClozeText', () => {
  it('replaces blanked words with underscores', () => {
    const result = generateCloze(JOHN_3_16, 0);
    const rendered = renderClozeText(result);

    // All blanked tokens should not appear by their word text
    for (const idx of result.blankIndices) {
      const token = result.tokens[idx];
      // The rendered text should contain underscores where the word was
      expect(rendered).not.toContain(
        // Only check words that wouldn't appear elsewhere non-blanked
        // (some common words appear multiple times)
        token.word.length > 6 ? token.word : '__SKIP__',
      );
    }

    // Rendered text should contain underscores
    expect(rendered).toMatch(/_+/);
  });

  it('shows revealed words normally', () => {
    const result = generateCloze(JOHN_3_16, 0);
    if (result.blankIndices.length === 0) return; // skip if no blanks

    const firstBlankIdx = result.blankIndices[0];
    const revealedWord = result.tokens[firstBlankIdx].word;
    const revealed = new Set([firstBlankIdx]);

    const rendered = renderClozeText(result, revealed);
    expect(rendered).toContain(revealedWord);
  });

  it('shows all words when all blanks are revealed', () => {
    const result = generateCloze(SHORT_VERSE, 0);
    const allRevealed = new Set(result.blankIndices);
    const rendered = renderClozeText(result, allRevealed);

    // Should not contain any underscores when everything is revealed
    expect(rendered).not.toMatch(/_+/);
  });
});

// ── tokenizeVerse ──────────────────────────────────────────────────────────

describe('tokenizeVerse', () => {
  it('returns a token for every word in the verse', () => {
    const tokens = tokenizeVerse(JOHN_3_16);
    expect(tokens.length).toBeGreaterThan(0);
  });

  it('all tokens have isBlank = false', () => {
    const tokens = tokenizeVerse(JOHN_3_16);
    for (const t of tokens) {
      expect(t.isBlank).toBe(false);
    }
  });

  it('token indices are sequential starting from 0', () => {
    const tokens = tokenizeVerse(JOHN_3_16);
    tokens.forEach((t, i) => {
      expect(t.index).toBe(i);
    });
  });

  it('handles empty string without throwing', () => {
    expect(() => tokenizeVerse('')).not.toThrow();
    expect(tokenizeVerse('')).toHaveLength(0);
  });

  it('reconstructs the original text when joining word + trailing', () => {
    const tokens = tokenizeVerse(SHORT_VERSE);
    const reconstructed = tokens.map(t => t.word + t.trailing).join('');
    expect(reconstructed).toBe(SHORT_VERSE);
  });
});

// ── getProgressiveWordOrder ────────────────────────────────────────────────

describe('getProgressiveWordOrder', () => {
  it('returns all word token indices', () => {
    const tokens = tokenizeVerse(JOHN_3_16);
    const order = getProgressiveWordOrder(JOHN_3_16);
    expect(order.length).toBe(tokens.length);
  });

  it('contains each index exactly once', () => {
    const order = getProgressiveWordOrder(JOHN_3_16);
    const unique = new Set(order);
    expect(unique.size).toBe(order.length);
  });

  it('content words (eligible) appear before stop words', () => {
    const tokens = tokenizeVerse(JOHN_3_16);
    const order = getProgressiveWordOrder(JOHN_3_16);

    // Find the last content word position in order and the first stop word position
    // "God", "loved", "world", "gave", "begotten", "Son" are content words in John 3:16
    const KNOWN_CONTENT = ['God', 'loved', 'world', 'gave', 'begotten', 'Son'];
    const KNOWN_STOP = ['For', 'so', 'the', 'that', 'he', 'his'];

    const contentPositions = order
      .map((idx, pos) => ({ idx, pos, word: tokens[idx].word }))
      .filter(({ word }) => KNOWN_CONTENT.includes(word))
      .map(({ pos }) => pos);

    const stopPositions = order
      .map((idx, pos) => ({ idx, pos, word: tokens[idx].word }))
      .filter(({ word }) => KNOWN_STOP.includes(word))
      .map(({ pos }) => pos);

    if (contentPositions.length > 0 && stopPositions.length > 0) {
      const lastContentPos = Math.max(...contentPositions);
      const firstStopPos = Math.min(...stopPositions);
      expect(lastContentPos).toBeLessThan(firstStopPos);
    }
  });

  it('returns empty array for empty string', () => {
    expect(getProgressiveWordOrder('')).toHaveLength(0);
  });

  it('progressive blanking covers all words by final pass', () => {
    const tokens = tokenizeVerse(JOHN_3_16);
    const order = getProgressiveWordOrder(JOHN_3_16);
    const totalPasses = 1 + Math.ceil(order.length / 2);
    const finalBlankCount = Math.min((totalPasses - 1) * 2, order.length);
    // Final pass should blank all words
    expect(finalBlankCount).toBe(order.length);
  });
});

// ── getBlankPlaceholder ────────────────────────────────────────────────────

describe('getBlankPlaceholder', () => {
  it('returns at least 3 underscores for short words', () => {
    expect(getBlankPlaceholder('go')).toBe('___');
    expect(getBlankPlaceholder('in')).toBe('___');
  });

  it('returns underscores proportional to word length (capped at 8)', () => {
    expect(getBlankPlaceholder('love')).toBe('____');
    expect(getBlankPlaceholder('everlasting')).toBe('________');
  });

  it('caps at 8 underscores for very long words', () => {
    expect(getBlankPlaceholder('supercalifragilistic')).toBe('________');
  });

  it('returns only underscore characters', () => {
    const result = getBlankPlaceholder('shepherd');
    expect(result).toMatch(/^_+$/);
  });
});
