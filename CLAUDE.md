# Engraft — Claude AI Working Context

> "These words shall be in thine heart" — Deuteronomy 6:6

## App Identity

**Name:** Engraft
**Platform:** iOS + Android (React Native / Expo)
**Mission:** Help church small groups deeply internalize KJV scripture through spaced repetition and cloze deletion — not just memorize verses, but have them rooted within them.
**Storage:** Local only. No backend. No authentication. All data lives in AsyncStorage on the device.
**Translation:** KJV only. This is an intentional, unchanging architectural decision (see Decisions section).

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React Native + Expo | SDK ~54 |
| Navigation | Expo Router (file-based) | ~6 |
| Storage | @react-native-async-storage/async-storage | ^3 |
| Language | TypeScript (strict mode) | ~5.9 |
| Testing | Jest + jest-expo | ^30 / ^55 |
| Styling | StyleSheet API only | — |

---

## Project Structure

```
engraft-app/
├── app/
│   ├── _layout.tsx          # Root stack navigator (no header, dark status bar)
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Bottom tab navigator (4 tabs)
│   │   ├── index.tsx        # Home — due count, recent verses
│   │   ├── review.tsx       # Review session — cloze cards + SM-2 rating
│   │   ├── add.tsx          # Add Verse — search by reference + preview
│   │   └── deck.tsx         # Deck overview — all verses, mastery, due dates
│   └── verse/[id].tsx       # Verse Detail — full text, stats, delete
├── components/
│   ├── MasteryBadge.tsx     # Colored badge: New / Learning / Mature
│   └── TabIcon.tsx          # Custom hand-drawn SVG-style tab icons
├── utils/
│   ├── sm2.ts               # SM-2 spaced repetition algorithm
│   ├── cloze.ts             # Cloze deletion engine
│   ├── storage.ts           # AsyncStorage CRUD wrapper
│   └── bible.ts             # KJV verse lookup + reference parser
├── constants/
│   ├── theme.ts             # Design tokens (colors, fonts, spacing, radii)
│   └── strings.ts           # All UI copy — never hardcode strings in components
├── assets/
│   └── kjv.json             # Bundled KJV dataset (~125 key memory verses)
├── __tests__/
│   ├── sm2.test.ts          # SM-2 algorithm unit tests
│   └── cloze.test.ts        # Cloze deletion engine unit tests
└── CLAUDE.md                # This file
```

---

## Design System Reference

All tokens are in `constants/theme.ts`. **Never hardcode values.**

### Colors

| Token | Value | Usage |
|---|---|---|
| `Colors.background` | `#F9F7F4` | App background — warm off-white |
| `Colors.card` | `#FFFFFF` | Card surfaces |
| `Colors.text` | `#1C1C1E` | Primary text |
| `Colors.textSecondary` | `#6B6B6B` | Muted labels |
| `Colors.textTertiary` | `#AEAEB2` | Placeholders, disabled |
| `Colors.accent` | `#C8892A` | CTAs, active states, reference text |
| `Colors.accentLight` | `#FBF0DC` | Accent backgrounds, success highlights |
| `Colors.border` | `#E5E0D8` | Dividers, input borders |
| `Colors.destructive` | `#C0392B` | Delete actions |
| `Colors.success` | `#2E7D32` | Mature mastery, success states |
| `Colors.warning` | `#E67E22` | Learning mastery, "Hard" rating |
| `Colors.blankUnderline` | `#C8892A` | Cloze blank underscores |
| `Colors.blankRevealBackground` | `#FBF0DC` | Revealed word highlight |

### Typography

- **Serif** (`Fonts.serif = 'Georgia'`): Scripture text, headings — the hero element
- **Sans** (`Fonts.sans = 'System'`): All UI elements, labels, buttons

### Spacing Scale

`Spacing.xxs(2)` → `xs(4)` → `sm(8)` → `md(12)` → `base(16)` → `lg(20)` → `xl(24)` → `xxl(32)` → `xxxl(48)` → `section(64)`

### Touch Targets

All interactive elements must be at minimum `TouchTarget = 44` pt in both dimensions (per Apple HIG and Material Design).

---

## Core Feature Descriptions

### 1. Verse Search (`add.tsx`)
- User types a reference like "John 3:16" or "Ps 23:1"
- `parseReference()` in `bible.ts` normalizes and parses the input
- `searchByReference()` looks up against the bundled KJV JSON
- Preview shows full verse text before adding
- Adding creates a `VerseCard` in AsyncStorage with an initial SM-2 schedule (due immediately)
- Duplicate detection prevents adding the same verse twice

**Acceptance criteria:**
- [ ] Accepts abbreviated book names (Ps, Rom, Eph, etc.)
- [ ] Shows clear "not found" state for invalid references
- [ ] Shows "already in your deck" state if duplicate
- [ ] Displays full KJV text before confirming
- [ ] After adding, user can search for another verse

### 2. Cloze Deletion (`cloze.ts`)
- Tokenizes verse text into words + trailing punctuation
- Skips stop words: articles, conjunctions, prepositions, pronouns, auxiliary verbs
- Only blanks words ≥ 3 characters
- Targets ~30–40% of total word count as blanks
- Selection is deterministic given the same seed (reproducible per card)
- Blanks shown as styled underscores proportional to word length (capped 3–8)

**Stop word categories:**
- Articles: a, an, the
- Conjunctions: and, but, or, nor, for, yet, so, that, which, who, etc.
- Prepositions: in, on, at, by, for, from, of, to, with, unto, upon, etc.
- Pronouns: I, me, my, he, him, his, she, her, they, them, thee, thou, thy, etc.
- Auxiliaries: is, am, are, was, were, have, has, had, do, does, will, shall, hath, doth, etc.

### 3. SM-2 Spaced Repetition (`sm2.ts`)
Four ratings map to SM-2 quality scores:

| Button | Quality | Behavior |
|---|---|---|
| Again | 0 | Reset: interval=1, repetition=0, ease decreases |
| Hard | 2 | Reset: interval=1, repetition=0, ease decreases more |
| Good | 4 | Advance: ease stays ~same; 1 → 6 → (n × ease) days |
| Easy | 5 | Advance: ease increases; longer interval |

- Ease factor starts at 2.5, minimum clamped to 1.3
- Mastery: `new` (0 reps) → `learning` (1–4) → `mature` (5+)

### 4. Review Session (`review.tsx`)
- Loads all cards where `dueDate <= now`
- Shows reference prominently above the cloze card
- User taps individual blanks to reveal them one at a time
- "Tap to reveal answer" button reveals all at once + shows rating buttons
- After rating, schedule is persisted and next card loads
- Session complete screen shown when queue is exhausted

### 5. Deck Overview (`deck.tsx`)
- Lists all cards sorted by due date (earliest first)
- Shows reference, italic text preview, mastery badge, due date
- "Due now" highlighted in accent color
- Taps navigate to verse detail

### 6. Verse Detail (`verse/[id].tsx`)
- Full KJV verse text as hero content
- Stats grid: mastery level, next review, interval, repetition count
- "Review Now" button if card is currently due
- Delete with confirmation alert (irreversible)

---

## SM-2 Algorithm — Expected Behavior

```
Initial state: interval=0, repetition=0, easeFactor=2.5, dueDate=now

After "good" × 1: interval=1, repetition=1
After "good" × 2: interval=6, repetition=2
After "good" × 3: interval=round(6 × 2.5)=15, repetition=3
After "good" × 4: interval=round(15 × 2.5)=38, repetition=4

easeFactor update formula:
  newEF = EF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  Clamped: max(1.3, newEF)

"again" or "hard" (quality < 3): reset repetition=0, interval=1
```

---

## Cloze Deletion Rules

```
Input: "For God so loved the world, that he gave his only begotten Son"

Tokens:    For  God  so  loved  the  world  that  he  gave  his  only  begotten  Son
Skip:      ✓    ✗   ✓   ✗      ✓    ✗      ✓     ✓   ✗     ✓    ✗     ✗         ✗
Eligible:       God       loved       world              gave        only  begotten  Son

Target ~30-40% of 13 words = 4-5 blanks
Selected (seed=0): [God, loved, gave, begotten, Son] (varies by seed)
```

**Never blank:** stop words (see list above), words < 3 chars
**Always eligible:** nouns, verbs, adjectives, proper names ≥ 3 chars

---

## Code Quality Rules

1. **TypeScript strict mode** — `tsconfig.json` has `"strict": true`. No `any` types, ever.
2. **No inline styles** — All styles via `StyleSheet.create()`, all tokens from `theme.ts`.
3. **No hardcoded strings** — All UI copy from `strings.ts`.
4. **No hardcoded colors/spacing** — Import from `theme.ts`.
5. **Typed props interfaces** — Every component has a typed `Props` interface.
6. **Functional components only** — No class components.
7. **Async error handling** — Every AsyncStorage call is wrapped in `try/catch`.
8. **No unhandled promises** — All async operations have `.catch()` or are `await`ed in try/catch.
9. **Touch targets** — All pressable elements have `minHeight: TouchTarget` (44pt).

---

## Testing Requirements

- Every function in `utils/` must have accompanying tests in `__tests__/`
- Tests live in `__tests__/*.test.ts` (not colocated)
- Run tests: `npm test`
- Tests must pass before shipping any change
- Use descriptive `describe` + `it` blocks
- Test edge cases: empty input, extreme values, all rating paths

```
npm test          # Run all tests once
npm run test:watch # Watch mode
```

---

## UX Principles

### Navigation
- Bottom tab navigation — 4 tabs: Home, Review, Add, Deck
- No more than 3 taps from Home to any core action
- Tab bar uses custom icons (no third-party icon library)

### States — every screen must handle:
1. **Loading** — `ActivityIndicator` with `Colors.accent` tint
2. **Empty** — Encouraging message + CTA to add a verse
3. **Error** — Clear message + retry or back action
4. **Success** — Confirmation feedback before routing

### Accessibility
- All interactive elements have `accessibilityRole` and `accessibilityLabel`
- Touch targets: minimum 44×44pt
- Color contrast: text colors meet WCAG AA against their backgrounds
- `accessibilityRole="button"` on all `TouchableOpacity` elements
- Cloze blanks have `accessibilityLabel="Hidden word, tap to reveal"`

### Design Principles
- Scripture text is always the hero — large serif, generous whitespace
- Cards feel like physical notecards — white, elevated, rounded
- Accent color (`#C8892A`) is warm amber — never cold or corporate
- Empty states are encouraging, not clinical

---

## Common Commands

```bash
npm start           # Start Expo dev server
npm run ios         # Open on iOS Simulator
npm run android     # Open on Android Emulator
npm test            # Run Jest tests (no watch)
npm run test:watch  # Run Jest in watch mode
npm run lint        # ESLint check
```

---

## Architectural Decisions & Rationale

### Local storage only (no backend)
**Why:** Small groups need the app to work offline — in church, in basements, in remote areas. No auth removes friction and privacy concerns. User data stays on their device.

### KJV translation only
**Why:** KJV is the dominant text for scripture memorization in many evangelical traditions, has superior literary cadence for memorization, and avoids the legal complexity of licensing modern translations (ESV, NIV, etc.). This decision is permanent.

### No gamification (no streaks, badges, points)
**Why:** The goal is internalization, not engagement metrics. Gamification can trivialize scripture. The spiritual gravity of the content should not compete with game mechanics.

### No third-party UI library (no NativeWind, Tamagui, etc.)
**Why:** Keeps the bundle small, avoids dependency churn, and forces intentional use of the design system. `StyleSheet.create()` is sufficient.

### SM-2 over FSRS or Anki's algorithm
**Why:** SM-2 is simple, well-understood, and proven over decades. FSRS is more accurate but significantly more complex to implement and explain. For a devotional app, simplicity is a feature.

### Bundled KJV JSON (not API)
**Why:** Offline-first. No rate limits. No API keys. No latency. The KJV is public domain. The bundled file starts with ~125 key memory verses; the full 31,102-verse dataset can be swapped in without code changes.

---

## Before Every New Feature — Required Checks

**Run these before starting any new screen or component:**

1. **Check `constants/theme.ts`** — Use only defined design tokens. Never hardcode colors, spacing, or font names.

2. **Check `constants/strings.ts`** — Add any new UI copy there first. Never write string literals in JSX.

3. **Define three states** — Before building UI, spec out the loading state, empty state, and error state for the new screen.

4. **Write utility logic first** — If new business logic is needed, write it in `utils/` and add tests before building the screen.

5. **Verify touch targets** — All interactive elements must have `minHeight: TouchTarget` (44pt) and appropriate `accessibilityRole`.

6. **Confirm navigation depth** — The new feature must be reachable in ≤ 3 taps from Home. Map the tap path before building.

7. **Run existing tests** — Run `npm test` before writing new code. Do not introduce regressions.

8. **Check imports** — Never import from a component that doesn't exist yet. Build dependencies bottom-up.

---

## File Naming Conventions

- Screen files: lowercase with hyphens in route segments, PascalCase export (Expo Router convention)
- Component files: `PascalCase.tsx`
- Utility files: `camelCase.ts`
- Test files: `camelCase.test.ts` in `__tests__/`
- Constant files: `camelCase.ts` in `constants/`
