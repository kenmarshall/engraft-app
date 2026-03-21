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
    againHint: 'Forgot',
    hardHint: 'Tomorrow',
    goodHint: 'A few days',
    easyHint: 'Weeks away',
    sessionComplete: 'Session Complete',
    sessionCompleteBody: 'Thou hast reviewed all due cards.',
    sessionCompleteAction: 'Back to Home',
    cardProgress: (current: number, total: number) => `Card ${current} of ${total}`,
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
    rangeGatedTitle: 'Disciple Feature',
    rangeGatedBody: 'Adding verses by range or chapter — like "John 3:1-5" or "Psalms 23" — is available in Engraft Disciple.',
  },

  // ── Deck Screen ───────────────────────────────────────────────────────────
  deck: {
    title: 'My Decks',
    emptyTitle: 'Thy deck is empty',
    emptyBody:
      'Add your first verse and begin the practice of hiding God\'s Word in your heart.',
    emptyAction: 'Add a Verse',
    totalVerses: (count: number) => (count === 1 ? '1 verse' : `${count} verses`),
    nextReview: 'Next review:',
    dueNow: 'Due now',
    dueCount: (n: number) => (n === 1 ? '1 due' : `${n} due`),
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

  // ── Disciple / Paywall ────────────────────────────────────────────────────
  pro: {
    paywallTitle: 'Engraft Disciple',
    paywallSubtitle: 'Deepen your scripture practice with powerful tools for organized study.',
    paywallAction: 'Become a Disciple',
    paywallDismiss: 'Maybe Later',
    badge: 'DISCIPLE',
    lockedFeature: 'Disciple Feature',

    // Feature list shown in paywall
    feature1: 'Unlimited verses',
    feature2: 'Multiple named decks',
    feature3: 'Add verses by range or chapter',
    feature4: 'Hard & Auto cloze difficulty',

    // Verse limit
    verseLimitTitle: 'Verse Limit Reached',
    verseLimitBody: 'Free accounts can store up to 15 verses. Become a Disciple for unlimited verses, named decks, and verse ranges.',

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
    paywallRestoredNone: 'No previous Engraft Disciple purchase was found for this account.',

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
    learnNow: 'Learn Now',
    notFound: 'Verse not found in your deck.',
  },

  // ── Mastery Labels ────────────────────────────────────────────────────────
  mastery: {
    new: 'Learning',
    learning: 'Reviewing',
    mature: 'Mastered',
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
    difficultyAuto: 'Auto',
    difficultyEasyHint: '~25% of words hidden',
    difficultyMediumHint: '~50% of words hidden',
    difficultyHardHint: 'All eligible words hidden',
    difficultyAutoHint: 'Adapts to your mastery level',

    // Account
    upgradePro: 'Become a Disciple',
    upgradeProSub: 'Verse ranges, named decks, and more',
    proActive: 'Engraft Disciple',
    proActiveSub: 'All features unlocked',
    manageSubscription: 'Manage Subscription',

    // Help
    howToUse: 'How to Use Engraft',
    helpStep1Title: '1. Add a verse',
    helpStep1Body: 'Go to the Add tab and type a reference like "John 3:16". Preview the text, then tap "Add to Memory". Disciple users can also add a full chapter or range — try "Psalms 23" or "John 3:1-5".',
    helpStep2Title: '2. Learn new verses',
    helpStep2Body: 'New verses open in a Learning session (Disciple). Three progressive passes gradually blank more words until you\'re reciting the full verse from memory. At the end, tap "Review Tomorrow" to schedule the card for cloze review, or "Learn Again" to repeat the session.',
    helpStep3Title: '3. Review scheduled cards',
    helpStep3Body: 'Cards you\'ve already learned come back as cloze cards on their scheduled day. Say the reference aloud, fill in the blanks from memory, then rate your recall: "Again" if you forgot, "Hard" for hesitation, "Good" for solid recall, "Easy" if effortless. Cards space out automatically as mastery grows.',
    helpStep4Title: '4. Say the reference',
    helpStep4Body: 'Before each card, say the reference aloud — e.g. "John 3:16". Say it again when you finish. Ending on the reference locks the verse to its location so you never forget where it comes from.',
    helpStep5Title: '5. Track your progress',
    helpStep5Body: 'The Deck tab shows every verse with its mastery — Learning, Reviewing, or Mastered — and next review date. Tap any verse to see its full stats or review it directly.',

    // Contact
    contactUs: 'Contact Us',
    contactUsSub: 'Report bugs, share feedback, or suggest features',

    // About
    privacyPolicy: 'Privacy Policy',
    version: (v: string) => `Version ${v}`,
    appDescription: 'Engraft helps you deeply internalize KJV scripture through spaced repetition and cloze deletion.',
  },

  // ── Learning Mode ─────────────────────────────────────────────────────────
  learning: {
    title: 'Learning',
    passOf: (current: number, total: number) => `Pass ${current} of ${total}`,
    upsellHint: 'Disciple includes guided Learning mode — step-by-step memorization for new verses.',
    upsellCta: 'Try Disciple',
    instruction: 'Say aloud: reference → verse → reference',
    continueButton: 'Next',
    nextPassButton: 'Next',
    revealAll: 'Reveal All',
    referenceBlankLabel: 'Scripture reference — tap to reveal',
    exitButton: 'Exit',
    reviewTomorrow: 'Review Tomorrow',
    learnAgain: 'Learn Again',
  },

  // ── Contact ───────────────────────────────────────────────────────────────
  contact: {
    title: 'Contact Us',
    categoryLabel: 'What is this about?',
    categoryBug: 'Bug Report',
    categoryFeedback: 'Feedback',
    categorySuggestion: 'Suggestion',
    messageLabel: 'Message',
    messagePlaceholder: "Tell us what's on your mind…",
    submit: 'Send Email',
    noMailApp: 'No Mail App Found',
    noMailAppBody: 'Please set up a mail app on your device, then try again.',
    emailSubject: (category: string) => `[Engraft] ${category}`,
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
