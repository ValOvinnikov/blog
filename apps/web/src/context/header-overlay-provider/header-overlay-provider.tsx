'use client';

import type { TMaybeNull } from '@blog/config';
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useMemo,
  useState,
} from 'react';

export const ACCOUNT_OVERLAY_ID = 'header-account';

export interface IHeaderOverlayContextValue {
  activeId: TMaybeNull<string>;
  setActiveId: Dispatch<SetStateAction<TMaybeNull<string>>>;
}

const HeaderOverlayContext =
  createContext<TMaybeNull<IHeaderOverlayContextValue>>(null);

/** One open state for the header's drawer, account panel and language menu, so opening one closes the others. */
export const HeaderOverlayProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [activeId, setActiveId] = useState<TMaybeNull<string>>(null);
  const value = useMemo(() => ({ activeId, setActiveId }), [activeId]);

  return (
    <HeaderOverlayContext.Provider value={value}>
      {children}
    </HeaderOverlayContext.Provider>
  );
};

export const useHeaderOverlay = () => useContext(HeaderOverlayContext);
