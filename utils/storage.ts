/**
 * Storage Layer
 *
 * All AsyncStorage operations for Engraft. Wraps @react-native-async-storage/async-storage
 * with typed interfaces and consistent error handling.
 *
 * Data model:
 *   Key: "engraft:deck"           → VerseCard[] (all cards)
 *   Key: "engraft:lastReviewDate" → ISO string
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CardSchedule, createInitialSchedule } from './sm2';

// ── Types ─────────────────────────────────────────────────────────────────

export interface VerseCard {
  /** Unique ID: "{book}-{chapter}-{verse}" e.g. "John-3-16" */
  id: string;
  book: string;
  chapter: number;
  verse: number;
  /** Full KJV verse text */
  text: string;
  /** ISO 8601 string for when this card was added */
  addedAt: string;
  /** SM-2 schedule */
  schedule: CardSchedule;
}

// ── Storage keys ──────────────────────────────────────────────────────────

const KEYS = {
  deck: 'engraft:deck',
  lastReviewDate: 'engraft:lastReviewDate',
} as const;

// ── Deck operations ────────────────────────────────────────────────────────

/**
 * Load all cards from storage. Returns an empty array on error or if not set.
 */
export async function loadDeck(): Promise<VerseCard[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.deck);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as VerseCard[];
  } catch {
    return [];
  }
}

/**
 * Persist the full deck to storage.
 */
export async function saveDeck(deck: VerseCard[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.deck, JSON.stringify(deck));
  } catch {
    // Storage errors are silently swallowed — the in-memory state remains consistent
  }
}

/**
 * Add a new verse card to the deck. No-op if the card ID already exists.
 * Returns the updated deck.
 */
export async function addCard(
  card: Omit<VerseCard, 'schedule' | 'addedAt'>,
): Promise<VerseCard[]> {
  const deck = await loadDeck();
  const exists = deck.some((c) => c.id === card.id);
  if (exists) return deck;

  const newCard: VerseCard = {
    ...card,
    addedAt: new Date().toISOString(),
    schedule: createInitialSchedule(),
  };

  const updated = [...deck, newCard];
  await saveDeck(updated);
  return updated;
}

/**
 * Update a single card's schedule in the deck.
 * Returns the updated deck.
 */
export async function updateCardSchedule(
  cardId: string,
  schedule: CardSchedule,
): Promise<VerseCard[]> {
  const deck = await loadDeck();
  const updated = deck.map((c) =>
    c.id === cardId ? { ...c, schedule } : c,
  );
  await saveDeck(updated);
  return updated;
}

/**
 * Remove a card from the deck by ID.
 * Returns the updated deck.
 */
export async function removeCard(cardId: string): Promise<VerseCard[]> {
  const deck = await loadDeck();
  const updated = deck.filter((c) => c.id !== cardId);
  await saveDeck(updated);
  return updated;
}

/**
 * Retrieve a single card by ID. Returns null if not found.
 */
export async function getCard(cardId: string): Promise<VerseCard | null> {
  const deck = await loadDeck();
  return deck.find((c) => c.id === cardId) ?? null;
}

/**
 * Check if a verse is already in the deck.
 */
export async function isInDeck(cardId: string): Promise<boolean> {
  const deck = await loadDeck();
  return deck.some((c) => c.id === cardId);
}

// ── Query helpers ──────────────────────────────────────────────────────────

/**
 * Get all cards that are due for review.
 */
export async function getDueCards(now: Date = new Date()): Promise<VerseCard[]> {
  const deck = await loadDeck();
  return deck.filter((c) => new Date(c.schedule.dueDate) <= now);
}

/**
 * Get cards sorted by due date (earliest first).
 */
export async function getDeckSortedByDue(): Promise<VerseCard[]> {
  const deck = await loadDeck();
  return [...deck].sort(
    (a, b) =>
      new Date(a.schedule.dueDate).getTime() -
      new Date(b.schedule.dueDate).getTime(),
  );
}

// ── Misc ───────────────────────────────────────────────────────────────────

/**
 * Build a canonical card ID from book/chapter/verse.
 */
export function makeCardId(book: string, chapter: number, verse: number): string {
  return `${book.replace(/\s+/g, '-')}-${chapter}-${verse}`;
}

/**
 * Clear all Engraft data from storage (for debugging / reset).
 */
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  } catch {
    // Silently fail
  }
}
