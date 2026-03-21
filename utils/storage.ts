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

/**
 * A named collection of verse cards.
 * Cards are shared entities — a card can belong to multiple decks.
 * The SM-2 schedule lives on the card, not the deck.
 */
export interface Deck {
  /** Unique ID: a UUID or slug */
  id: string;
  /** User-facing name, e.g. "Sermon on the Mount" */
  name: string;
  /** ISO 8601 string for when this deck was created */
  createdAt: string;
  /** Ordered list of card IDs belonging to this deck */
  cardIds: string[];
}

export interface VerseCard {
  /** Unique ID: "{book}-{chapter}-{verse}" or "{book}-{chapter}-{verse}-{endVerse}" for passages */
  id: string;
  book: string;
  chapter: number;
  verse: number;
  /**
   * For passage cards (ranges): the last verse number in the range.
   * Undefined for single-verse cards.
   */
  endVerse?: number;
  /** Full KJV verse text (single verse, or concatenated passage text) */
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
  hasSeenWelcome: 'engraft:hasSeenWelcome',
  decks: 'engraft:decks',
  difficulty: 'engraft:difficulty',
} as const;

/**
 * Cloze difficulty controls what percentage of words are blanked during review.
 * 'auto' (Disciple only) adapts based on the card's mastery level:
 *   new → easy (~25%), learning → medium (~50%), mature → hard (100%).
 */
export type ClozeDifficulty = 'easy' | 'medium' | 'hard' | 'auto';

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
 * Build a canonical card ID for a single verse.
 */
export function makeCardId(book: string, chapter: number, verse: number): string {
  return `${book.replace(/\s+/g, '-')}-${chapter}-${verse}`;
}

/**
 * Build a canonical card ID for a verse range / passage.
 */
export function makeRangeCardId(
  book: string,
  chapter: number,
  verseStart: number,
  verseEnd: number,
): string {
  return `${book.replace(/\s+/g, '-')}-${chapter}-${verseStart}-${verseEnd}`;
}

/**
 * Check if the user has seen the welcome/onboarding screen.
 */
export async function getHasSeenWelcome(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(KEYS.hasSeenWelcome);
    return value === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark the welcome/onboarding screen as seen.
 */
export async function setHasSeenWelcome(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.hasSeenWelcome, 'true');
  } catch {
    // Silently fail — worst case user sees welcome again
  }
}

/**
 * Get the user's cloze difficulty preference.
 * Pass a defaultValue to control what is returned when no preference is stored.
 * Free users should pass 'medium'; Pro users should pass 'auto'.
 */
export async function getDifficulty(defaultValue: ClozeDifficulty = 'medium'): Promise<ClozeDifficulty> {
  try {
    const value = await AsyncStorage.getItem(KEYS.difficulty);
    if (value === 'easy' || value === 'medium' || value === 'hard' || value === 'auto') return value;
    return defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Persist the cloze difficulty preference.
 */
export async function setDifficulty(difficulty: ClozeDifficulty): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.difficulty, difficulty);
  } catch {
    // Silently fail — preference will revert to default on next load
  }
}

/**
 * Seed the deck with a list of pre-selected starter verses.
 * Skips any verse that is already in the deck.
 */
export async function seedDeck(
  verses: Omit<VerseCard, 'schedule' | 'addedAt'>[],
): Promise<void> {
  const deck = await loadDeck();
  const existingIds = new Set(deck.map((c) => c.id));
  const now = new Date().toISOString();

  const newCards: VerseCard[] = verses
    .filter((v) => !existingIds.has(v.id))
    .map((v) => ({
      ...v,
      addedAt: now,
      schedule: createInitialSchedule(),
    }));

  if (newCards.length === 0) return;
  await saveDeck([...deck, ...newCards]);
}

// ── Deck (named collections) CRUD ──────────────────────────────────────────

/**
 * Load all named decks from storage. Returns an empty array on error.
 */
export async function loadDecks(): Promise<Deck[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.decks);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Deck[];
  } catch {
    return [];
  }
}

async function saveDecks(decks: Deck[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.decks, JSON.stringify(decks));
  } catch {
    // Silently swallow storage errors
  }
}

/**
 * Create a new named deck. Returns the created deck.
 */
export async function createDeck(name: string): Promise<Deck> {
  const decks = await loadDecks();
  const newDeck: Deck = {
    id: `deck-${Date.now()}`,
    name: name.trim(),
    createdAt: new Date().toISOString(),
    cardIds: [],
  };
  await saveDecks([...decks, newDeck]);
  return newDeck;
}

/**
 * Rename an existing deck. No-op if the deck ID is not found.
 */
export async function renameDeck(deckId: string, name: string): Promise<void> {
  const decks = await loadDecks();
  await saveDecks(decks.map((d) => (d.id === deckId ? { ...d, name: name.trim() } : d)));
}

/**
 * Delete a named deck (does not delete the underlying cards).
 */
export async function deleteDeck(deckId: string): Promise<void> {
  const decks = await loadDecks();
  await saveDecks(decks.filter((d) => d.id !== deckId));
}

/**
 * Add a card ID to a named deck. No-op if already present.
 */
export async function addCardToDeck(deckId: string, cardId: string): Promise<void> {
  const decks = await loadDecks();
  await saveDecks(
    decks.map((d) =>
      d.id === deckId && !d.cardIds.includes(cardId)
        ? { ...d, cardIds: [...d.cardIds, cardId] }
        : d,
    ),
  );
}

/**
 * Remove a card ID from a named deck.
 */
export async function removeCardFromDeck(deckId: string, cardId: string): Promise<void> {
  const decks = await loadDecks();
  await saveDecks(
    decks.map((d) =>
      d.id === deckId ? { ...d, cardIds: d.cardIds.filter((id) => id !== cardId) } : d,
    ),
  );
}

/**
 * Load the full VerseCard objects for a named deck, in deck order.
 */
export async function getDeckCards(deckId: string): Promise<VerseCard[]> {
  const [decks, allCards] = await Promise.all([loadDecks(), loadDeck()]);
  const deck = decks.find((d) => d.id === deckId);
  if (!deck) return [];
  const cardMap = new Map(allCards.map((c) => [c.id, c]));
  return deck.cardIds.flatMap((id) => {
    const card = cardMap.get(id);
    return card ? [card] : [];
  });
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
