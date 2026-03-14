/**
 * RevenueCat Purchases Wrapper
 *
 * Thin abstraction over react-native-purchases. The rest of the app never
 * imports the SDK directly — all IAP logic goes through this module.
 */

import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { RC_API_KEY_IOS, RC_API_KEY_ANDROID, ENTITLEMENT_ID, DEBUG_FORCE_PRO } from '@/constants/pro';

export type { PurchasesOffering, PurchasesPackage };

/** Initialize the RevenueCat SDK. Call once at app startup. */
export async function initializePurchases(): Promise<void> {
  try {
    const apiKey = Platform.OS === 'ios' ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;
    Purchases.setLogLevel(LOG_LEVEL.ERROR);
    Purchases.configure({ apiKey });
  } catch {
    // SDK init failure (e.g. invalid API key in dev) — app continues without IAP
  }
}

/** Returns true if the user has an active Pro entitlement. */
export async function getProStatus(): Promise<boolean> {
  // Dev-only override — never active in production builds (__DEV__ === false)
  if (__DEV__ && DEBUG_FORCE_PRO) return true;

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return ENTITLEMENT_ID in customerInfo.entitlements.active;
  } catch {
    return false;
  }
}

/** Returns the current RevenueCat offering, or null if unavailable. */
export async function fetchOfferings(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch {
    return null;
  }
}

export type PurchaseResult =
  | { status: 'success' }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

/** Purchase a RevenueCat package. Handles user-cancellation silently. */
export async function purchasePackage(pkg: PurchasesPackage): Promise<PurchaseResult> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const active = ENTITLEMENT_ID in customerInfo.entitlements.active;
    return active
      ? { status: 'success' }
      : { status: 'error', message: 'Purchase completed but entitlement was not activated.' };
  } catch (err: unknown) {
    // RevenueCat sets userCancelled=true when the user dismisses the sheet
    if (
      typeof err === 'object' &&
      err !== null &&
      'userCancelled' in err &&
      (err as { userCancelled: boolean }).userCancelled
    ) {
      return { status: 'cancelled' };
    }
    const message = err instanceof Error ? err.message : 'Purchase failed. Please try again.';
    return { status: 'error', message };
  }
}

export type RestoreResult =
  | { status: 'success' }
  | { status: 'none' }
  | { status: 'error'; message: string };

/** Open RevenueCat's Customer Center (subscription management UI). */
export async function presentCustomerCenter(): Promise<void> {
  await RevenueCatUI.presentCustomerCenter();
}

/** Restore purchases made on another device or after reinstall. */
export async function restorePurchases(): Promise<RestoreResult> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    const active = ENTITLEMENT_ID in customerInfo.entitlements.active;
    return active ? { status: 'success' } : { status: 'none' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Restore failed. Please try again.';
    return { status: 'error', message };
  }
}
