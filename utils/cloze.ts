/**
 * Cloze Deletion Engine
 *
 * Automatically generates fill-in-the-blank (cloze) deletions from KJV scripture.
 *
 * Rules:
 * - Target ~30–40% of words as blanks
 * - SKIP:  articles, conjunctions, common prepositions, and pronouns
 * - BLANK: nouns, verbs, adjectives, adverbs, and proper names
 * - Punctuation attached to a word is preserved outside the blank
 * - Short words (1–2 chars) that aren't clearly significant are skipped
 */

/** A single token in the parsed verse */
export interface VerseToken {
  /** The original word text (without surrounding punctuation) */
  word: string;
  /** Punctuation or whitespace that trails the word in the source text */
  trailing: string;
  /** Whether this token should be presented as a blank */
  isBlank: boolean;
  /** Index in the token array */
  index: number;
}

/** The output of the cloze engine */
export interface ClozeResult {
  /** Original verse text */
  originalText: string;
  /** Array of tokens — render these to build the cloze display */
  tokens: VerseToken[];
  /** Indices of tokens that are blanked */
  blankIndices: number[];
}

// ── Stop-word lists ────────────────────────────────────────────────────────

/** Articles — always skip */
const ARTICLES = new Set(['a', 'an', 'the']);

/** Common conjunctions — always skip */
const CONJUNCTIONS = new Set([
  'and', 'but', 'or', 'nor', 'for', 'yet', 'so',
  'that', 'which', 'who', 'whom', 'whose', 'when', 'where', 'while',
  'although', 'because', 'since', 'though', 'unless', 'until', 'whether',
  'both', 'either', 'neither', 'not', 'only', 'also',
]);

/** Common prepositions — always skip */
const PREPOSITIONS = new Set([
  'in', 'on', 'at', 'by', 'for', 'from', 'of', 'to', 'with',
  'about', 'above', 'after', 'against', 'along', 'among', 'around',
  'before', 'behind', 'below', 'beneath', 'beside', 'besides', 'between',
  'beyond', 'down', 'during', 'except', 'into', 'near', 'off', 'out',
  'outside', 'over', 'past', 'since', 'through', 'throughout', 'till',
  'under', 'until', 'unto', 'up', 'upon', 'within', 'without',
]);

/** Common pronouns — always skip */
const PRONOUNS = new Set([
  'i', 'me', 'my', 'mine', 'myself',
  'you', 'your', 'yours', 'yourself',
  'he', 'him', 'his', 'himself',
  'she', 'her', 'hers', 'herself',
  'it', 'its', 'itself',
  'we', 'us', 'our', 'ours', 'ourselves',
  'they', 'them', 'their', 'theirs', 'themselves',
  // KJV archaic forms
  'thee', 'thou', 'thy', 'thine', 'thyself',
  'ye', 'yea', 'nay',
]);

/** Auxiliary / linking verbs — skip to preserve sentence structure */
const AUXILIARIES = new Set([
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'shall', 'should', 'may', 'might', 'can', 'could',
  'must', 'ought',
  // KJV forms
  'hath', 'doth', 'wilt', 'shalt', 'canst', 'wouldst', 'shouldst',
]);

/** Builds the combined stop-word set */
const STOP_WORDS = new Set([
  ...ARTICLES,
  ...CONJUNCTIONS,
  ...PREPOSITIONS,
  ...PRONOUNS,
  ...AUXILIARIES,
]);

// ── Target blank rates by difficulty ──────────────────────────────────────

/** Blank ratio bounds for each difficulty level. */
const DIFFICULTY_RATIOS = {
  easy:   { min: 0.15, max: 0.25 },
  medium: { min: 0.30, max: 0.40 },
  hard:   { min: 0.45, max: 0.55 },
} as const;

// ── Tokenizer ─────────────────────────────────────────────────────────────

/**
 * Split verse text into word tokens, preserving trailing punctuation.
 * Handles KJV punctuation: commas, semicolons, colons, periods, em-dashes, parentheses.
 */
function tokenize(text: string): Array<{ word: string; trailing: string }> {
  const tokens: Array<{ word: string; trailing: string }> = [];

  // Match: optional leading punctuation is not needed — split on word boundaries
  // Pattern: a "word" is any sequence of alphabetic chars (including apostrophes for contractions)
  // followed by optional trailing punctuation/whitespace
  const pattern = /([A-Za-z']+)([^A-Za-z']*)/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const word = match[1];
    const trailing = match[2];
    if (word.length > 0) {
      tokens.push({ word, trailing });
    }
  }

  return tokens;
}

/**
 * Determine whether a word is a stop word (should never be blanked).
 */
function isStopWord(word: string): boolean {
  return STOP_WORDS.has(word.toLowerCase());
}

/**
 * Determine whether a word is eligible to be blanked.
 * Eligible words are at least 3 characters and not stop words.
 */
function isEligible(word: string): boolean {
  if (word.length < 3) return false;
  if (isStopWord(word)) return false;
  return true;
}

// ── Main export ────────────────────────────────────────────────────────────

/**
 * Generate cloze deletions for a KJV verse.
 *
 * @param verseText   Full verse text
 * @param seed        Optional numeric seed for deterministic selection (default: 0)
 * @param difficulty  Blank density — 'easy' (~20%), 'medium' (~35%), 'hard' (~50%). Default: 'medium'
 * @returns ClozeResult with tokens and blank indices
 */
export function generateCloze(
  verseText: string,
  seed: number = 0,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
): ClozeResult {
  const rawTokens = tokenize(verseText);

  // Build initial token list
  const tokens: VerseToken[] = rawTokens.map((t, i) => ({
    word: t.word,
    trailing: t.trailing,
    isBlank: false,
    index: i,
  }));

  // Collect eligible token indices
  const eligibleIndices = tokens
    .filter((t) => isEligible(t.word))
    .map((t) => t.index);

  // Determine how many blanks to create based on difficulty
  const { min: minRatio, max: maxRatio } = DIFFICULTY_RATIOS[difficulty];
  const totalWords = tokens.length;
  const targetMin = Math.ceil(totalWords * minRatio);
  const targetMax = Math.floor(totalWords * maxRatio);
  const targetCount = Math.min(
    eligibleIndices.length,
    Math.max(targetMin, Math.round((targetMin + targetMax) / 2)),
  );

  // Select which eligible tokens to blank using a deterministic shuffle
  const selected = selectIndices(eligibleIndices, targetCount, seed);
  const blankSet = new Set(selected);

  // Apply blanks
  for (const token of tokens) {
    token.isBlank = blankSet.has(token.index);
  }

  return {
    originalText: verseText,
    tokens,
    blankIndices: selected.sort((a, b) => a - b),
  };
}

/**
 * Deterministically select `count` indices from `pool` using a simple
 * seeded shuffle (Knuth-Fisher-Yates with an LCG random).
 */
function selectIndices(pool: number[], count: number, seed: number): number[] {
  const arr = [...pool];
  let s = seed;

  // LCG parameters (same as glibc)
  const lcg = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(lcg() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr.slice(0, count);
}

/**
 * Render a cloze result to a display string, replacing blanked words with underscores.
 * Useful for accessibility labels and plain-text contexts.
 *
 * @param result     ClozeResult from generateCloze
 * @param revealed   Set of blank indices the user has already revealed
 */
export function renderClozeText(
  result: ClozeResult,
  revealed: Set<number> = new Set(),
): string {
  return result.tokens
    .map((t) => {
      const word =
        t.isBlank && !revealed.has(t.index)
          ? '_'.repeat(Math.max(3, t.word.length))
          : t.word;
      return word + t.trailing;
    })
    .join('');
}

/**
 * Get the blank placeholder string for display (styled underscores).
 * Length is proportional to the hidden word to avoid giving away length.
 */
export function getBlankPlaceholder(word: string): string {
  // Use a fixed width (not exact length) to avoid giving away the answer
  const len = Math.max(3, Math.min(8, word.length));
  return '_'.repeat(len);
}
