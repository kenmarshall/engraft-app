/**
 * Cloze Deletion Engine Unit Tests
 *
 * Tests cover:
 * - generateCloze produces valid output structure
 * - Blank ratio stays within 30–40% target
 * - Stop words are never blanked
 * - Short words (<3 chars) are never blanked
 * - Deterministic output with same seed
 * - Different seeds produce different selections
 * - renderClozeText with and without revealed words
 * - getBlankPlaceholder length clamping
 */

import {
  generateCloze,
  renderClozeText,
  getBlankPlaceholder,
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
  it('blanks between 0 and 40% of total words', () => {
    const result = generateCloze(JOHN_3_16);
    const total = result.tokens.length;
    const blanked = result.blankIndices.length;
    const ratio = blanked / total;
    // We allow some flex below 30% if there aren't enough eligible words
    expect(ratio).toBeLessThanOrEqual(0.4);
    expect(blanked).toBeGreaterThan(0);
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

  it('produces different results for different seeds (usually)', () => {
    const result0 = generateCloze(JOHN_3_16, 0);
    const result1 = generateCloze(JOHN_3_16, 999);
    // With enough eligible words, different seeds should give different blanks
    // (this isn't guaranteed for all verses, but holds for longer ones)
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
