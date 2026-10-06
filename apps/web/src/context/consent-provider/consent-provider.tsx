'use client';

import { CONSENT_CATEGORY, type TConsentCategory } from '@blog/config';
import {
  OPTIONAL_CONSENT_CATEGORIES,
  parseConsentCookieValue,
} from '@web/utils/consent-cookie';
import {
  createContext,
  useContext,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import {
  getConsentSnapshot,
  getServerConsentSnapshot,
  subscribeToConsent,
  writeConsent,
} from './consent-store';

type TConsentStatus = 'unknown' | 'granted' | 'denied' | 'unanswered';

type TConsentState =
  | { status: 'unknown' }
  | { status: 'unanswered' }
  | { status: 'answered'; granted: readonly TConsentCategory[] };

interface IConsentContext {
  state: TConsentState;
  isPreferencesOpen: boolean;
  openPreferences: () => void;
  closePreferences: () => void;
}

const ConsentContext = createContext<IConsentContext | undefined>(undefined);

const toConsentState = (snapshot: string | null): TConsentState => {
  if (snapshot === null) return { status: 'unknown' };
  const granted = parseConsentCookieValue(snapshot);
  return granted ? { status: 'answered', granted } : { status: 'unanswered' };
};

const getGranted = (state: TConsentState): readonly TConsentCategory[] =>
  state.status === 'answered' ? state.granted : [];

const useConsentContext = (): IConsentContext => {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error('Consent hooks must be used within a ConsentProvider');
  }
  return context;
};

export interface IConsentProviderProps {
  children: ReactNode;
}

export const ConsentProvider = ({ children }: IConsentProviderProps) => {
  const snapshot = useSyncExternalStore(
    subscribeToConsent,
    getConsentSnapshot,
    getServerConsentSnapshot,
  );
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  return (
    <ConsentContext.Provider
      value={{
        state: toConsentState(snapshot),
        isPreferencesOpen,
        openPreferences: () => setIsPreferencesOpen(true),
        closePreferences: () => setIsPreferencesOpen(false),
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
};

export const useConsent = (
  category: TConsentCategory,
): { status: TConsentStatus; grant: () => void } => {
  const { state } = useConsentContext();
  const granted = getGranted(state);

  const grant = () => {
    if (category === CONSENT_CATEGORY.NECESSARY) return;
    writeConsent([...new Set([...granted, category])]);
  };

  if (state.status !== 'answered') {
    return { status: state.status, grant };
  }
  const isGranted =
    category === CONSENT_CATEGORY.NECESSARY || granted.includes(category);
  return { status: isGranted ? 'granted' : 'denied', grant };
};

export const useConsentChoices = () => {
  const { state } = useConsentContext();
  return {
    status: state.status,
    granted: getGranted(state),
    acceptAll: () => writeConsent(OPTIONAL_CONSENT_CATEGORIES),
    rejectAll: () => writeConsent([]),
    save: writeConsent,
  };
};

export const useConsentPreferences = () => {
  const { isPreferencesOpen, openPreferences, closePreferences } =
    useConsentContext();
  return { isPreferencesOpen, openPreferences, closePreferences };
};
