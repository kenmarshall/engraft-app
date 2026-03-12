/**
 * Bible Lookup Utilities
 *
 * Provides verse lookup against the bundled KJV JSON dataset.
 * The dataset lives at assets/kjv.json and is loaded once at module init.
 */

import kjvData from '@/assets/kjv.json';

// ── Types ─────────────────────────────────────────────────────────────────

export interface KJVVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface ParsedReference {
  book: string;
  chapter: number;
  verse: number;
}

// ── KJV Dataset ────────────────────────────────────────────────────────────

// Cast the imported JSON to our typed array
const VERSES: KJVVerse[] = kjvData as KJVVerse[];

// Build a lookup map for O(1) access: "Book-chapter-verse" → KJVVerse
const VERSE_MAP = new Map<string, KJVVerse>();
for (const v of VERSES) {
  VERSE_MAP.set(makeKey(v.book, v.chapter, v.verse), v);
}

function makeKey(book: string, chapter: number, verse: number): string {
  return `${book.toLowerCase()}-${chapter}-${verse}`;
}

// ── Reference Parser ───────────────────────────────────────────────────────

/** Resolve a split "prefix + name" book input to its canonical KJV name. */
function resolveBook(prefix: string, name: string): string | null {
  const rawBook = (prefix + name).toLowerCase().replace(/\s+/g, '');
  const rawBookWithSpace = (prefix + ' ' + name).toLowerCase().trim().replace(/\s+/g, ' ');
  return (
    BOOK_ALIASES[rawBook] ??
    BOOK_ALIASES[rawBookWithSpace] ??
    BOOK_ALIASES[name.toLowerCase()] ??
    null
  );
}

/**
 * Known book name aliases for flexible user input.
 * Maps normalized user input → canonical KJV book name.
 */
const BOOK_ALIASES: Record<string, string> = {
  // Old Testament
  gen: 'Genesis',
  genesis: 'Genesis',
  ex: 'Exodus',
  exo: 'Exodus',
  exodus: 'Exodus',
  lev: 'Leviticus',
  leviticus: 'Leviticus',
  num: 'Numbers',
  numbers: 'Numbers',
  deut: 'Deuteronomy',
  deu: 'Deuteronomy',
  deuteronomy: 'Deuteronomy',
  josh: 'Joshua',
  joshua: 'Joshua',
  judg: 'Judges',
  judges: 'Judges',
  ruth: 'Ruth',
  '1sam': '1 Samuel',
  '1samuel': '1 Samuel',
  '2sam': '2 Samuel',
  '2samuel': '2 Samuel',
  '1ki': '1 Kings',
  '1kings': '1 Kings',
  '2ki': '2 Kings',
  '2kings': '2 Kings',
  '1chr': '1 Chronicles',
  '2chr': '2 Chronicles',
  ezra: 'Ezra',
  neh: 'Nehemiah',
  nehemiah: 'Nehemiah',
  esth: 'Esther',
  esther: 'Esther',
  job: 'Job',
  ps: 'Psalms',
  psa: 'Psalms',
  psalm: 'Psalms',
  psalms: 'Psalms',
  prov: 'Proverbs',
  proverbs: 'Proverbs',
  eccl: 'Ecclesiastes',
  ecclesiastes: 'Ecclesiastes',
  song: 'Song of Solomon',
  'song of solomon': 'Song of Solomon',
  isa: 'Isaiah',
  isaiah: 'Isaiah',
  jer: 'Jeremiah',
  jeremiah: 'Jeremiah',
  lam: 'Lamentations',
  lamentations: 'Lamentations',
  ezek: 'Ezekiel',
  ezekiel: 'Ezekiel',
  dan: 'Daniel',
  daniel: 'Daniel',
  hos: 'Hosea',
  hosea: 'Hosea',
  joel: 'Joel',
  amos: 'Amos',
  obad: 'Obadiah',
  obadiah: 'Obadiah',
  jonah: 'Jonah',
  jon: 'Jonah',
  mic: 'Micah',
  micah: 'Micah',
  nah: 'Nahum',
  nahum: 'Nahum',
  hab: 'Habakkuk',
  habakkuk: 'Habakkuk',
  zeph: 'Zephaniah',
  zephaniah: 'Zephaniah',
  hag: 'Haggai',
  haggai: 'Haggai',
  zech: 'Zechariah',
  zechariah: 'Zechariah',
  mal: 'Malachi',
  malachi: 'Malachi',
  // New Testament
  matt: 'Matthew',
  mat: 'Matthew',
  matthew: 'Matthew',
  mark: 'Mark',
  luke: 'Luke',
  john: 'John',
  acts: 'Acts',
  rom: 'Romans',
  romans: 'Romans',
  '1cor': '1 Corinthians',
  '1corinthians': '1 Corinthians',
  '2cor': '2 Corinthians',
  '2corinthians': '2 Corinthians',
  gal: 'Galatians',
  galatians: 'Galatians',
  eph: 'Ephesians',
  ephesians: 'Ephesians',
  phil: 'Philippians',
  philippians: 'Philippians',
  col: 'Colossians',
  colossians: 'Colossians',
  '1thess': '1 Thessalonians',
  '2thess': '2 Thessalonians',
  '1tim': '1 Timothy',
  '2tim': '2 Timothy',
  titus: 'Titus',
  phlm: 'Philemon',
  philemon: 'Philemon',
  heb: 'Hebrews',
  hebrews: 'Hebrews',
  james: 'James',
  jas: 'James',
  '1pet': '1 Peter',
  '1peter': '1 Peter',
  '2pet': '2 Peter',
  '2peter': '2 Peter',
  '1john': '1 John',
  '2john': '2 John',
  '3john': '3 John',
  jude: 'Jude',
  rev: 'Revelation',
  revelation: 'Revelation',
};

/**
 * Parse a user-entered scripture reference into its components.
 * Supports formats like:
 *   "John 3:16"
 *   "1 John 4:8"
 *   "Romans 8:28"
 *   "Ps 23:1"
 *   "1Cor 13:4"
 *
 * Returns null if the reference cannot be parsed.
 */
export function parseReference(input: string): ParsedReference | null {
  const trimmed = input.trim();

  // Pattern: optional leading digit (for books like "1 John"),
  // then book name, then chapter:verse
  const match = trimmed.match(
    /^(\d\s*)?([A-Za-z]+(?:\s+[A-Za-z]+)*)\s+(\d+):(\d+)$/,
  );

  if (!match) return null;

  const bookPrefix = match[1] ? match[1].trim() : '';
  const bookName = match[2].trim();
  const chapter = parseInt(match[3], 10);
  const verse = parseInt(match[4], 10);

  if (isNaN(chapter) || isNaN(verse)) return null;

  const canonical = resolveBook(bookPrefix, bookName);
  if (!canonical) return null;

  return { book: canonical, chapter, verse };
}

// ── Verse Lookup ───────────────────────────────────────────────────────────

/**
 * Look up a verse by canonical reference. Returns null if not found.
 */
export function lookupVerse(
  book: string,
  chapter: number,
  verse: number,
): KJVVerse | null {
  return VERSE_MAP.get(makeKey(book, chapter, verse)) ?? null;
}

/**
 * Search by a user-entered reference string.
 * Returns the matching verse or null.
 */
export function searchByReference(input: string): KJVVerse | null {
  const parsed = parseReference(input);
  if (!parsed) return null;
  return lookupVerse(parsed.book, parsed.chapter, parsed.verse);
}

/**
 * Format a verse reference for display: "John 3:16"
 */
export function formatReference(
  book: string,
  chapter: number,
  verse: number,
): string {
  return `${book} ${chapter}:${verse}`;
}

/**
 * Format a passage reference for display: "John 3:1–5" or "Psalms 23" (whole chapter).
 * Use endVerse = undefined for whole-chapter passages.
 */
export function formatReferenceRange(
  book: string,
  chapter: number,
  verseStart: number,
  verseEnd?: number,
): string {
  if (verseEnd === undefined || verseEnd === verseStart) {
    return `${book} ${chapter}:${verseStart}`;
  }
  return `${book} ${chapter}:${verseStart}–${verseEnd}`;
}

/**
 * Get all verses in the dataset (for search/browse features).
 */
export function getAllVerses(): KJVVerse[] {
  return VERSES;
}

/** Canonical ordered list of all 66 KJV book names. */
const BOOK_NAMES: readonly string[] = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
  'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
  'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
  'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews',
  'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
  'Jude', 'Revelation',
];

// ── Range / Chapter Lookup ──────────────────────────────────────────────────

export interface ParsedRangeReference {
  book: string;
  chapter: number;
  /** undefined means "whole chapter" */
  verseStart?: number;
  verseEnd?: number;
}

/**
 * Parse a verse range or whole-chapter reference.
 * Supported formats:
 *   "Psalms 100"         → whole chapter
 *   "John 3:1-5"         → verse range
 *   "Romans 8:28-39"     → verse range
 *
 * Returns null if the reference cannot be parsed or if verseEnd < verseStart.
 */
export function parseRangeReference(input: string): ParsedRangeReference | null {
  const trimmed = input.trim();

  // Try "Book chapter:verseStart-verseEnd"
  const rangeMatch = trimmed.match(
    /^(\d\s*)?([A-Za-z]+(?:\s+[A-Za-z]+)*)\s+(\d+):(\d+)-(\d+)$/,
  );
  if (rangeMatch) {
    const bookPrefix = rangeMatch[1] ? rangeMatch[1].trim() : '';
    const bookName = rangeMatch[2].trim();
    const chapter = parseInt(rangeMatch[3], 10);
    const verseStart = parseInt(rangeMatch[4], 10);
    const verseEnd = parseInt(rangeMatch[5], 10);
    if (isNaN(chapter) || isNaN(verseStart) || isNaN(verseEnd)) return null;
    if (verseEnd < verseStart) return null;
    const canonical = resolveBook(bookPrefix, bookName);
    if (!canonical) return null;
    return { book: canonical, chapter, verseStart, verseEnd };
  }

  // Try "Book chapter" (whole chapter)
  const chapterMatch = trimmed.match(
    /^(\d\s*)?([A-Za-z]+(?:\s+[A-Za-z]+)*)\s+(\d+)$/,
  );
  if (chapterMatch) {
    const bookPrefix = chapterMatch[1] ? chapterMatch[1].trim() : '';
    const bookName = chapterMatch[2].trim();
    const chapter = parseInt(chapterMatch[3], 10);
    if (isNaN(chapter)) return null;
    const canonical = resolveBook(bookPrefix, bookName);
    if (!canonical) return null;
    return { book: canonical, chapter };
  }

  return null;
}

/**
 * Return all verses in a chapter, in verse order.
 */
export function lookupChapter(book: string, chapter: number): KJVVerse[] {
  return VERSES
    .filter((v) => v.book === book && v.chapter === chapter)
    .sort((a, b) => a.verse - b.verse);
}

/**
 * Return a range of verses within a chapter, inclusive.
 * Clamps to available verses (will not error on out-of-range).
 */
export function lookupRange(
  book: string,
  chapter: number,
  verseStart: number,
  verseEnd: number,
): KJVVerse[] {
  return VERSES
    .filter((v) => v.book === book && v.chapter === chapter && v.verse >= verseStart && v.verse <= verseEnd)
    .sort((a, b) => a.verse - b.verse);
}

/**
 * Return up to `limit` book names that match the query.
 * Matches prefix first, then "contains", case-insensitively.
 */
export function suggestBooks(query: string, limit = 6): string[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const prefixMatches = BOOK_NAMES.filter((b) =>
    b.toLowerCase().startsWith(q),
  );
  const containsMatches = BOOK_NAMES.filter(
    (b) => !b.toLowerCase().startsWith(q) && b.toLowerCase().includes(q),
  );

  return [...prefixMatches, ...containsMatches].slice(0, limit);
}
