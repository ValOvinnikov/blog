'use client';

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
  settingsButtonRef: RefObject<HTMLElement | null>;
};

const ConsentPreferencesContext = createContext<
  TConsentPreferences | undefined
>(undefined);

export type TConsentPreferencesProviderProps = {
  children: ReactNode;
};

export const ConsentPreferencesProvider = ({
  children,
}: TConsentPreferencesProviderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const settingsButtonRef = useRef<HTMLElement>(null);

  return (
    <ConsentPreferencesContext.Provider
      value={{
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        settingsButtonRef,
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
