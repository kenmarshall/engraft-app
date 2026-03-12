/**
 * Pro Context
 *
 * Provides isPro status throughout the app and a single openPaywall() trigger.
 * The ProPaywall modal is owned here so any screen can open it with one call.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { initializePurchases, getProStatus } from '@/utils/purchases';
import { ProPaywall } from '@/components/ProPaywall';

interface ProContextValue {
  /** True once the SDK confirms an active Pro entitlement */
  isPro: boolean;
  /** True while the SDK is initializing or checking entitlements */
  proLoading: boolean;
  /** Open the full paywall modal from anywhere in the app */
  openPaywall: () => void;
  /** Re-check entitlement status — call after a purchase or restore */
  refreshProStatus: () => Promise<void>;
}

const ProContext = createContext<ProContextValue>({
  isPro: false,
  proLoading: true,
  openPaywall: () => {},
  refreshProStatus: async () => {},
});

export function useProStatus(): ProContextValue {
  return useContext(ProContext);
}

interface ProProviderProps {
  children: React.ReactNode;
}

export function ProProvider({ children }: ProProviderProps) {
  const [isPro, setIsPro] = useState(false);
  const [proLoading, setProLoading] = useState(true);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const initialized = useRef(false);

  const refreshProStatus = useCallback(async () => {
    const status = await getProStatus();
    setIsPro(status);
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    (async () => {
      try {
        await initializePurchases();
        await refreshProStatus();
      } catch {
        // Non-fatal — app works fully without Pro
      } finally {
        setProLoading(false);
      }
    })();
  }, [refreshProStatus]);

  const openPaywall = useCallback(() => setPaywallVisible(true), []);

  const handlePurchaseSuccess = useCallback(async () => {
    await refreshProStatus();
    setPaywallVisible(false);
  }, [refreshProStatus]);

  return (
    <ProContext.Provider value={{ isPro, proLoading, openPaywall, refreshProStatus }}>
      {children}
      <ProPaywall
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        onPurchaseSuccess={handlePurchaseSuccess}
      />
    </ProContext.Provider>
  );
}
