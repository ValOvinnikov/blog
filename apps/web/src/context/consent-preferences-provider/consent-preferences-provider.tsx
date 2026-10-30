'use client';

import type { TMaybeNull, TNullable } from '@blog/config';
import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';

type TConsentPreferences = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  footerControlRef: RefObject<TMaybeNull<HTMLElement>>;
  floatingControlRef: RefObject<TMaybeNull<HTMLButtonElement>>;
  returnFocusRef: RefObject<TMaybeNull<HTMLElement>>;
};

const ConsentPreferencesContext = createContext<
  TConsentPreferences | undefined
>(undefined);

export type TConsentPreferencesProviderProps = {
  children: ReactNode;
};

const toFocusable = (element: TNullable<Element>) =>
  element instanceof HTMLElement ? element : null;

export const ConsentPreferencesProvider = ({
  children,
}: TConsentPreferencesProviderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const footerControlRef = useRef<HTMLElement>(null);
  const floatingControlRef = useRef<HTMLButtonElement>(null);
  // Read when the dialog closes, so it names a control mounted then rather than one gone with the banner.
  const [returnFocusRef] = useState<RefObject<TMaybeNull<HTMLElement>>>(() => ({
    get current() {
      return (
        floatingControlRef.current ??
        toFocusable(footerControlRef.current?.firstElementChild)
      );
    },
  }));

  return (
    <ConsentPreferencesContext.Provider
      value={{
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        footerControlRef,
        floatingControlRef,
        returnFocusRef,
      }}
    >
      {children}
    </ConsentPreferencesContext.Provider>
  );
};

export const useConsentPreferences = (): TConsentPreferences => {
  const context = useContext(ConsentPreferencesContext);
  if (!context) {
    throw new Error(
      'useConsentPreferences must be used within a ConsentPreferencesProvider',
    );
  }
  return context;
};
