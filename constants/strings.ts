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
    blankAccessibility: 'Hidden word, tap to reveal',
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
    searchHint: 'Enter a book name, chapter, and verse (e.g. John 3:16)',
    searchButton: 'Search',
    preview: 'Preview',
    addToMemory: 'Add to Memory',
    addAnother: 'Add Another Verse',
    alreadyAdded: 'Already in your deck',
    notFound: 'Verse not found',
    notFoundBody: 'Check the reference and try again (e.g. "Romans 8:28" or "John 3:1-5").',
    searching: 'Searching…',
    added: 'Verse added to your deck!',
    addedMultiple: (count: number) => `${count} verses added to your deck!`,
    confirmTitle: 'Add this verse?',
    confirmBody: 'This verse will be added to your deck for daily review.',
    confirmRangeTitle: (count: number) => `Add ${count} verses?`,
    confirmRangeBody: 'These verses will be added to your deck for daily review.',
    cancel: 'Cancel',
    confirm: 'Add Verse',
    confirmRange: (count: number) => `Add ${count} Verses`,
    rangePreview: (count: number) => `${count} verses`,
    chapterPreview: (book: string, chapter: number) => `${book} ${chapter}`,
    verseCount: (n: number) => (n === 1 ? '1 verse' : `${n} verses`),
    rangeGatedTitle: 'Pro Feature',
    rangeGatedBody: 'Adding verses by range or chapter — like "John 3:1-5" or "Psalms 23" — is available in Engraft Pro.',
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
    allVerses: 'All Verses',
    newDeck: 'New Deck',
    deckNamePlaceholder: 'e.g. Sermon on the Mount',
    deckNameLabel: 'Deck Name',
    createDeck: 'Create Deck',
    editDeck: 'Edit Deck',
    deleteDeck: 'Delete Deck',
    deleteDeckMessage: 'This will remove the deck but keep your verses. This cannot be undone.',
    deleteDeckConfirm: 'Delete',
    renameDeck: 'Rename Deck',
    emptyDeckTitle: 'This deck is empty',
    emptyDeckBody: 'Add verses to this deck from the Add tab.',
    deckCount: (count: number) => (count === 1 ? '1 deck' : `${count} decks`),
  },

  // ── Pro / Paywall ──────────────────────────────────────────────────────────
  pro: {
    paywallTitle: 'Engraft Pro',
    paywallSubtitle: 'Deepen your scripture practice with powerful tools for organized study.',
    paywallAction: 'Upgrade to Pro',
    paywallDismiss: 'Maybe Later',
    badge: 'PRO',
    lockedFeature: 'Pro Feature',

    // Feature list shown in paywall
    feature1: 'Multiple named decks',
    feature2: 'Add verses by range or chapter',
    feature3: 'Organize scripture by topic or study',

    // Package selection
    paywallMonthly: 'Monthly',
    paywallAnnual: 'Annual',
    paywallBestValue: 'Best Value',
    paywallPerMonth: ' / month',
    paywallPerYear: ' / year',
    paywallCta: (isAnnual: boolean) =>
      isAnnual ? 'Continue with Annual' : 'Continue with Monthly',

    // Loading / errors
    paywallLoading: 'Loading offers…',
    paywallNoOffers: 'Offers unavailable right now. Please try again later.',

    // Restore
    paywallRestore: 'Restore Purchases',
    paywallRestoring: 'Restoring…',
    paywallRestoredNoneTitle: 'No Purchase Found',
    paywallRestoredNone: 'No previous Engraft Pro purchase was found for this account.',

    // Fine print
    paywallTerms: 'Recurring billing. Cancel anytime in your device Settings.',
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
    notFound: 'Verse not found in your deck.',
  },

  // ── Mastery Labels ────────────────────────────────────────────────────────
  mastery: {
    new: 'New',
    learning: 'Learning',
    mature: 'Mature',
  },

  // ── Onboarding / Welcome ──────────────────────────────────────────────────
  onboarding: {
    title: 'Welcome to Engraft',
    body: 'Engraft God\'s Word in your heart through daily scripture memorization.',
    addFirst: 'Add My First Verse',
    loadStarter: 'Load Starter Verses',
    loadingStarter: 'Loading verses…',
    starterLoaded: (count: number) =>
      count === 1 ? '1 verse added to your deck' : `${count} verses added to your deck`,
  },

  // ── Settings ──────────────────────────────────────────────────────────────
  settings: {
    title: 'Settings',

    // Sections
    sectionReview: 'Review',
    sectionAccount: 'Account',
    sectionHelp: 'Help',
    sectionAbout: 'About',

    // Cloze difficulty
    difficultyLabel: 'Cloze Difficulty',
    difficultyEasy: 'Easy',
    difficultyMedium: 'Medium',
    difficultyHard: 'Hard',
    difficultyEasyHint: '~20% of words hidden',
    difficultyMediumHint: '~35% of words hidden',
    difficultyHardHint: '~50% of words hidden',

    // Account
    upgradePro: 'Upgrade to Pro',
    upgradeProSub: 'Verse ranges, named decks, and more',
    proActive: 'Engraft Pro',
    proActiveSub: 'All features unlocked',
    manageSubscription: 'Manage Subscription',

    // Help
    howToUse: 'How to Use Engraft',
    helpStep1Title: '1. Add a verse',
    helpStep1Body: 'Go to the Add tab and type a reference like "John 3:16". Preview the text, then tap "Add to Memory".',
    helpStep2Title: '2. Review daily',
    helpStep2Body: 'Open the Home tab and tap "Start Review". Before you begin each card, say the reference aloud (e.g. "John 3:16"). Then fill in the blanks from memory — tap each blank to reveal it one at a time. After reciting the full text, say the reference aloud again. Ending with the reference locks it to the verse so you never forget where it comes from.',
    helpStep3Title: '3. Rate yourself honestly',
    helpStep3Body: '"Again" if you struggled, "Hard" for hesitation, "Good" for solid recall, "Easy" if it felt effortless. Cards space out as mastery grows.',
    helpStep4Title: '4. Track your progress',
    helpStep4Body: 'The Deck tab shows every verse with its mastery level — New, Learning, or Mature — and its next review date.',

    // About
    privacyPolicy: 'Privacy Policy',
    version: (v: string) => `Version ${v}`,
    appDescription: 'Engraft helps you deeply internalize KJV scripture through spaced repetition and cloze deletion.',
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
