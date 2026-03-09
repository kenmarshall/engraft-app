/**
 * Engraft UI Copy
 * All user-facing strings live here. Never hardcode UI text in components.
 */

export const Strings = {
  // ── App Identity ──────────────────────────────────────────────────────────
  appName: 'Engraft',
  tagline: 'These words shall be in thine heart',
  taglineReference: 'Deuteronomy 6:6',

  // ── Tab Labels ────────────────────────────────────────────────────────────
  tabs: {
    home: 'Home',
    review: 'Review',
    add: 'Add',
    deck: 'Deck',
  },

  // ── Home Screen ───────────────────────────────────────────────────────────
  home: {
    dueToday: 'Due Today',
    dueCard: (count: number) => (count === 1 ? '1 card' : `${count} cards`),
    startReview: 'Start Review',
    recentVerses: 'Recent Verses',
    emptyTitle: 'Begin thy journey',
    emptyBody:
      'Add your first scripture verse to start building a life-changing memorization practice.',
    emptyAction: 'Add a Verse',
    noDueCards: 'All caught up!',
    noDueCardsBody: 'No reviews due. Come back tomorrow or add more verses.',
  },

  // ── Review Screen ─────────────────────────────────────────────────────────
  review: {
    title: 'Review',
    tapToReveal: 'Tap blank to reveal',
    tapToRevealAll: 'Tap to reveal answer',
    rateYourRecall: 'How well did you recall?',
    again: 'Again',
    hard: 'Hard',
    good: 'Good',
    easy: 'Easy',
    againHint: 'Complete blank',
    hardHint: '< 1 day',
    goodHint: 'A few days',
    easyHint: 'Long interval',
    sessionComplete: 'Session Complete',
    sessionCompleteBody: 'Thou hast reviewed all due cards.',
    sessionCompleteAction: 'Back to Home',
    cardProgress: (current: number, total: number) => `${current} / ${total}`,
    emptyTitle: 'Nothing to review',
    emptyBody: 'All cards are current. Add new verses or check back tomorrow.',
    emptyAction: 'Add a Verse',
  },

  // ── Add Verse Screen ──────────────────────────────────────────────────────
  add: {
    title: 'Add Verse',
    searchPlaceholder: 'Search by reference (e.g. John 3:16)',
    searchHint: 'Enter a book name, chapter, and verse',
    preview: 'Preview',
    addToMemory: 'Add to Memory',
    alreadyAdded: 'Already in your deck',
    notFound: 'Verse not found',
    notFoundBody: 'Check the reference and try again (e.g. "Romans 8:28").',
    searching: 'Searching…',
    added: 'Verse added to your deck!',
    confirmTitle: 'Add this verse?',
    confirmBody: 'This verse will be added to your deck for daily review.',
    cancel: 'Cancel',
    confirm: 'Add Verse',
  },

  // ── Deck Screen ───────────────────────────────────────────────────────────
  deck: {
    title: 'My Deck',
    emptyTitle: 'Thy deck is empty',
    emptyBody:
      'Add your first verse and begin the practice of hiding God\'s Word in your heart.',
    emptyAction: 'Add a Verse',
    totalVerses: (count: number) => (count === 1 ? '1 verse' : `${count} verses`),
    nextReview: 'Next review:',
    dueNow: 'Due now',
    dueToday: 'Due today',
    sortLabel: 'Sort',
  },

  // ── Verse Detail Screen ───────────────────────────────────────────────────
  verseDetail: {
    mastery: 'Mastery',
    nextReview: 'Next Review',
    interval: 'Interval',
    intervalDays: (days: number) => (days === 1 ? '1 day' : `${days} days`),
    repetitions: 'Repetitions',
    addedOn: 'Added',
    deleteTitle: 'Remove Verse',
    deleteMessage:
      'This will remove the verse and all its progress from your deck. This cannot be undone.',
    deleteConfirm: 'Remove',
    deleteCancel: 'Cancel',
    reviewNow: 'Review Now',
  },

  // ── Mastery Labels ────────────────────────────────────────────────────────
  mastery: {
    new: 'New',
    learning: 'Learning',
    mature: 'Mature',
  },

  // ── Common ────────────────────────────────────────────────────────────────
  common: {
    loading: 'Loading…',
    error: 'Something went wrong',
    errorBody: 'Please try again.',
    retry: 'Try Again',
    back: 'Back',
    done: 'Done',
    today: 'Today',
    tomorrow: 'Tomorrow',
  },
} as const;
