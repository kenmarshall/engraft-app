/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Based on the SuperMemo SM-2 algorithm (1987) by Piotr Woźniak.
 * Reference: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method
 *
 * Four user-facing quality ratings map to SM-2 quality scores (0–5):
 *   Again → 0  (complete blackout / no recall)
 *   Hard  → 2  (incorrect but on reflection it was close)
 *   Good  → 4  (correct with some hesitation)
 *   Easy  → 5  (perfect recall with no effort)
 *
 * Cards start with easeFactor = 2.5.
 * Minimum easeFactor is clamped to 1.3.
 */

export type Rating = 'again' | 'hard' | 'good' | 'easy';

/** Numeric quality score for SM-2 computation (0–5 scale) */
const QUALITY: Record<Rating, number> = {
  again: 0,
  hard: 2,
  good: 4,
  easy: 5,
};

/** SM-2 parameters */
const MIN_EASE_FACTOR = 1.3;
const DEFAULT_EASE_FACTOR = 2.5;

export interface CardSchedule {
  /** Days until the card is due again */
  interval: number;
  /** Number of consecutive successful reviews */
  repetition: number;
  /** Ease factor — controls how quickly the interval grows */
  easeFactor: number;
  /** ISO 8601 date string for when the card is next due */
  dueDate: string;
}

/**
 * Compute the next schedule for a card given its current schedule and a rating.
 *
 * @param current  The card's current SM-2 schedule
 * @param rating   User's recall rating for this review
 * @param now      Optional override for "now" (defaults to current time, useful for testing)
 * @returns        Updated schedule to persist
 */
export function scheduleCard(
  current: CardSchedule,
  rating: Rating,
  now: Date = new Date(),
): CardSchedule {
  const quality = QUALITY[rating];

  let { interval, repetition, easeFactor } = current;

  if (quality < 3) {
    // Failed recall — reset to beginning
    repetition = 0;
    interval = 1;
  } else {
    // Successful recall — advance the schedule
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetition += 1;
  }

  // Update ease factor (SM-2 formula)
  easeFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // Clamp ease factor to minimum
  if (easeFactor < MIN_EASE_FACTOR) {
    easeFactor = MIN_EASE_FACTOR;
  }

  // Compute due date
  const dueDate = addDays(now, interval);

  return {
    interval,
    repetition,
    easeFactor: parseFloat(easeFactor.toFixed(4)),
    dueDate: dueDate.toISOString(),
  };
}

/**
 * Create the initial schedule for a brand-new card.
 */
export function createInitialSchedule(now: Date = new Date()): CardSchedule {
  return {
    interval: 0,
    repetition: 0,
    easeFactor: DEFAULT_EASE_FACTOR,
    dueDate: now.toISOString(), // Due immediately
  };
}

/**
 * Check whether a card is due for review.
 *
 * @param schedule  The card's current schedule
 * @param now       Optional override for "now"
 */
export function isDue(schedule: CardSchedule, now: Date = new Date()): boolean {
  return new Date(schedule.dueDate) <= now;
}

/**
 * Determine mastery level based on repetition count.
 *
 * - New:      0 successful reviews
 * - Learning: 1–4 successful reviews
 * - Mature:   5+ successful reviews (interval typically > 21 days)
 */
export function getMasteryLevel(
  schedule: CardSchedule,
): 'new' | 'learning' | 'mature' {
  if (schedule.repetition === 0) return 'new';
  if (schedule.repetition < 5) return 'learning';
  return 'mature';
}

/** Add `days` days to a Date, returning a new Date */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Format a due date for display.
 * Returns "Today", "Tomorrow", or a short date string.
 */
export function formatDueDate(dueDateIso: string, now: Date = new Date()): string {
  const due = new Date(dueDateIso);
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  const dueDay = startOfDay(due);

  if (dueDay.getTime() <= today.getTime()) return 'Today';
  if (dueDay.getTime() === tomorrow.getTime()) return 'Tomorrow';

  return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
