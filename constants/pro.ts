/**
 * RevenueCat Configuration
 *
 * ── SETUP CHECKLIST ──────────────────────────────────────────────────────────
 * 1. Create a RevenueCat account at https://app.revenuecat.com
 * 2. Create a new Project → configure Apple App Store and/or Google Play
 * 3. Create subscription products in App Store Connect / Google Play Console:
 *      Monthly:  Product ID = "engraft_pro_monthly"  (~$2.99/mo)
 *      Annual:   Product ID = "engraft_pro_annual"   (~$19.99/yr)
 * 4. In RevenueCat: Entitlements → create one named "pro", attach both products
 * 5. In RevenueCat: Offerings → create "default" offering, add monthly + annual packages
 * 6. Copy your API keys from RevenueCat → Project → API Keys and replace below
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** RevenueCat iOS API key — get from app.revenuecat.com → Project → API Keys → Apple App Store */
export const RC_API_KEY_IOS = 'appl_rnnQuRaaojVilnLvjbjhMqYRkch';

/** RevenueCat Android API key — get from app.revenuecat.com → Project → API Keys → Google Play Store */
export const RC_API_KEY_ANDROID = 'goog_REPLACE_WITH_YOUR_ANDROID_KEY';

/** Must match the Entitlement identifier you created in RevenueCat (step 4 above) */
export const ENTITLEMENT_ID = 'pro';

/** Maximum verses a free user can add. Disciple users have no limit. */
export const FREE_VERSE_LIMIT = 15;

// ── Dev testing ───────────────────────────────────────────────────────────────
/**
 * Set to true to bypass RevenueCat and force Pro UI in development builds.
 * This flag is automatically ignored in production — `__DEV__` is false in
 * any build produced by `expo build` or `eas build`.
 *
 * Usage:
 *   DEBUG_FORCE_PRO = true   → app behaves as if Pro is active
 *   DEBUG_FORCE_PRO = false  → normal free-user flow (default)
 */
export const DEBUG_FORCE_PRO = false;

/** Public URL for the privacy policy page — engraftapp.com/privacy redirects to GitHub Pages via Cloudflare */
export const PRIVACY_POLICY_URL = 'https://engraftapp.com/privacy';

/** Email address that receives contact form submissions and is listed in the privacy policy. */
export const CONTACT_EMAIL = 'support@engraftapp.com';
