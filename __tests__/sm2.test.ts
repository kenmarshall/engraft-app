/**
 * SM-2 Algorithm Unit Tests
 *
 * Tests cover:
 * - Initial schedule creation
 * - All four rating paths (again, hard, good, easy)
 * - Interval progression over multiple reviews
 * - Ease factor clamping
 * - isDue logic
 * - getMasteryLevel logic
 * - formatDueDate
 */

import {
  scheduleCard,
  createInitialSchedule,
  isDue,
  getMasteryLevel,
  formatDueDate,
  type CardSchedule,
  type Rating,
} from '../utils/sm2';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeDate(daysFromNow: number): Date {
  const d = new Date('2025-01-01T12:00:00.000Z');
  d.setDate(d.getDate() + daysFromNow);
  return d;
}

const BASE_DATE = makeDate(0);

// ── createInitialSchedule ──────────────────────────────────────────────────

describe('createInitialSchedule', () => {
  it('creates a schedule with correct defaults', () => {
    const schedule = createInitialSchedule(BASE_DATE);
    expect(schedule.interval).toBe(0);
    expect(schedule.repetition).toBe(0);
    expect(schedule.easeFactor).toBe(2.5);
  });

  it('sets dueDate to now (card immediately due)', () => {
    const now = new Date('2025-06-15T10:00:00.000Z');
    const schedule = createInitialSchedule(now);
    expect(new Date(schedule.dueDate).getTime()).toBe(now.getTime());
  });
});

// ── scheduleCard — "Again" rating ──────────────────────────────────────────

describe('scheduleCard — again', () => {
  it('resets interval to 1 and repetition to 0', () => {
    const initial = createInitialSchedule(BASE_DATE);
    const result = scheduleCard(initial, 'again', BASE_DATE);
    expect(result.interval).toBe(1);
    expect(result.repetition).toBe(0);
  });

  it('reduces ease factor', () => {
    const initial = createInitialSchedule(BASE_DATE);
    const result = scheduleCard(initial, 'again', BASE_DATE);
    expect(result.easeFactor).toBeLessThan(2.5);
  });

  it('clamps ease factor to minimum of 1.3', () => {
    // Apply "again" many times to drive ease factor to minimum
    let schedule = createInitialSchedule(BASE_DATE);
    for (let i = 0; i < 20; i++) {
      schedule = scheduleCard(schedule, 'again', BASE_DATE);
    }
    expect(schedule.easeFactor).toBeGreaterThanOrEqual(1.3);
  });
});

// ── scheduleCard — "Hard" rating ───────────────────────────────────────────

describe('scheduleCard — hard', () => {
  it('resets to interval=1, repetition=0 (quality < 3)', () => {
    const initial = createInitialSchedule(BASE_DATE);
    const result = scheduleCard(initial, 'hard', BASE_DATE);
    expect(result.interval).toBe(1);
    expect(result.repetition).toBe(0);
  });

  it('reduces ease factor from default', () => {
    const initial = createInitialSchedule(BASE_DATE);
    const result = scheduleCard(initial, 'hard', BASE_DATE);
    expect(result.easeFactor).toBeLessThan(2.5);
  });
});

// ── scheduleCard — "Good" rating ───────────────────────────────────────────

describe('scheduleCard — good', () => {
  it('first review sets interval to 1, repetition to 1', () => {
    const initial = createInitialSchedule(BASE_DATE);
    const result = scheduleCard(initial, 'good', BASE_DATE);
    expect(result.interval).toBe(1);
    expect(result.repetition).toBe(1);
  });

  it('second review sets interval to 6', () => {
    const schedule1 = scheduleCard(createInitialSchedule(BASE_DATE), 'good', BASE_DATE);
    const schedule2 = scheduleCard(schedule1, 'good', BASE_DATE);
    expect(schedule2.interval).toBe(6);
    expect(schedule2.repetition).toBe(2);
  });

  it('third review multiplies by ease factor', () => {
    let schedule = createInitialSchedule(BASE_DATE);
    schedule = scheduleCard(schedule, 'good', BASE_DATE); // interval=1
    schedule = scheduleCard(schedule, 'good', BASE_DATE); // interval=6
    const prevInterval = schedule.interval;
    const prevEase = schedule.easeFactor;
    schedule = scheduleCard(schedule, 'good', BASE_DATE);
    expect(schedule.interval).toBe(Math.round(prevInterval * prevEase));
    expect(schedule.repetition).toBe(3);
  });

  it('does not decrease ease factor on good', () => {
    const initial = createInitialSchedule(BASE_DATE);
    const result = scheduleCard(initial, 'good', BASE_DATE);
    // SM-2: quality=4, delta = 0.1 - (5-4)*(0.08 + (5-4)*0.02) = 0.1 - 0.1 = 0
    expect(result.easeFactor).toBeCloseTo(2.5, 2);
  });
});

// ── scheduleCard — "Easy" rating ───────────────────────────────────────────

describe('scheduleCard — easy', () => {
  it('increases ease factor on easy', () => {
    const initial = createInitialSchedule(BASE_DATE);
    const result = scheduleCard(initial, 'easy', BASE_DATE);
    expect(result.easeFactor).toBeGreaterThan(2.5);
  });

  it('advances interval faster than good over multiple reviews', () => {
    let goodSchedule = createInitialSchedule(BASE_DATE);
    let easySchedule = createInitialSchedule(BASE_DATE);

    for (let i = 0; i < 5; i++) {
      goodSchedule = scheduleCard(goodSchedule, 'good', BASE_DATE);
      easySchedule = scheduleCard(easySchedule, 'easy', BASE_DATE);
    }

    expect(easySchedule.interval).toBeGreaterThan(goodSchedule.interval);
  });
});

// ── Interval progression ───────────────────────────────────────────────────

describe('interval progression with consistent good ratings', () => {
  it('follows 1, 6, ~15 pattern for first three good reviews', () => {
    let schedule = createInitialSchedule(BASE_DATE);

    schedule = scheduleCard(schedule, 'good', BASE_DATE);
    expect(schedule.interval).toBe(1);

    schedule = scheduleCard(schedule, 'good', BASE_DATE);
    expect(schedule.interval).toBe(6);

    schedule = scheduleCard(schedule, 'good', BASE_DATE);
    expect(schedule.interval).toBe(Math.round(6 * 2.5)); // 15
  });
});

// ── dueDate ────────────────────────────────────────────────────────────────

describe('dueDate computation', () => {
  it('sets due date `interval` days in the future', () => {
    const now = new Date('2025-01-01T00:00:00.000Z');
    const initial = createInitialSchedule(now);
    const result = scheduleCard(initial, 'good', now);
    const expected = new Date(now);
    expected.setDate(expected.getDate() + result.interval);
    expect(new Date(result.dueDate).toDateString()).toBe(expected.toDateString());
  });
});

// ── isDue ──────────────────────────────────────────────────────────────────

describe('isDue', () => {
  it('returns true when dueDate is in the past', () => {
    const schedule: CardSchedule = {
      interval: 1,
      repetition: 1,
      easeFactor: 2.5,
      dueDate: makeDate(-1).toISOString(),
    };
    expect(isDue(schedule, BASE_DATE)).toBe(true);
  });

  it('returns true when dueDate is exactly now', () => {
    const schedule: CardSchedule = {
      interval: 0,
      repetition: 0,
      easeFactor: 2.5,
      dueDate: BASE_DATE.toISOString(),
    };
    expect(isDue(schedule, BASE_DATE)).toBe(true);
  });

  it('returns false when dueDate is in the future', () => {
    const schedule: CardSchedule = {
      interval: 7,
      repetition: 2,
      easeFactor: 2.5,
      dueDate: makeDate(5).toISOString(),
    };
    expect(isDue(schedule, BASE_DATE)).toBe(false);
  });
});

// ── getMasteryLevel ────────────────────────────────────────────────────────

describe('getMasteryLevel', () => {
  const baseSchedule: CardSchedule = {
    interval: 1,
    repetition: 0,
    easeFactor: 2.5,
    dueDate: BASE_DATE.toISOString(),
  };

  it('returns "new" for 0 repetitions', () => {
    expect(getMasteryLevel({ ...baseSchedule, repetition: 0 })).toBe('new');
  });

  it('returns "learning" for 1–4 repetitions', () => {
    for (let r = 1; r <= 4; r++) {
      expect(getMasteryLevel({ ...baseSchedule, repetition: r })).toBe('learning');
    }
  });

  it('returns "mature" for 5+ repetitions', () => {
    for (let r = 5; r <= 10; r++) {
      expect(getMasteryLevel({ ...baseSchedule, repetition: r })).toBe('mature');
    }
  });
});

// ── formatDueDate ──────────────────────────────────────────────────────────

describe('formatDueDate', () => {
  const now = new Date('2025-06-15T12:00:00.000Z');

  it('returns "Today" when due date is in the past', () => {
    const yesterday = new Date('2025-06-14T12:00:00.000Z');
    expect(formatDueDate(yesterday.toISOString(), now)).toBe('Today');
  });

  it('returns "Today" when due date is today', () => {
    const today = new Date('2025-06-15T08:00:00.000Z');
    expect(formatDueDate(today.toISOString(), now)).toBe('Today');
  });

  it('returns "Tomorrow" when due date is tomorrow', () => {
    const tomorrow = new Date('2025-06-16T12:00:00.000Z');
    expect(formatDueDate(tomorrow.toISOString(), now)).toBe('Tomorrow');
  });

  it('returns a formatted date string for future dates', () => {
    const future = new Date('2025-07-04T12:00:00.000Z');
    const result = formatDueDate(future.toISOString(), now);
    expect(result).toBe('Jul 4');
  });
});

// ── Rating enum completeness ───────────────────────────────────────────────

describe('all ratings are handled', () => {
  const ratings: Rating[] = ['again', 'hard', 'good', 'easy'];

  it('produces a valid schedule for every rating', () => {
    const initial = createInitialSchedule(BASE_DATE);
    for (const rating of ratings) {
      const result = scheduleCard(initial, rating, BASE_DATE);
      expect(result.interval).toBeGreaterThanOrEqual(1);
      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
      expect(typeof result.dueDate).toBe('string');
    }
  });
});
