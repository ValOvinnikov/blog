'use client';

import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

export const ACCOUNT_OVERLAY_ID = 'header-account';

export interface IOpenOverlay {
  id: string;
  takesKeys: boolean;
}

export interface IHeaderOverlayContextValue {
  openOverlays: readonly IOpenOverlay[];
  openOverlay: (overlay: IOpenOverlay, parentId?: string) => void;
  closeOverlay: (id: string) => void;
}

const indexOfOverlay = (overlays: readonly IOpenOverlay[], id?: string) =>
  overlays.findIndex((overlay) => overlay.id === id);

const HeaderOverlayContext =
  createContext<TMaybeNull<IHeaderOverlayContextValue>>(null);

const HeaderOverlayParentContext =
  createContext<TMaybeUndefined<string>>(undefined);

/** One open path for the header's drawer, account panel and language menu: opening one closes the others, except the open overlay it sits inside. */
export const HeaderOverlayProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [openOverlays, setOpenOverlays] = useState<readonly IOpenOverlay[]>([]);

  const openOverlay = useCallback(
    (overlay: IOpenOverlay, parentId?: string) => {
      setOpenOverlays((overlays) => {
        const parentIndex = indexOfOverlay(overlays, parentId);
        return [...overlays.slice(0, parentIndex + 1), overlay];
      });
    },
    [],
  );

  const closeOverlay = useCallback((id: string) => {
    setOpenOverlays((overlays) => {
      const index = indexOfOverlay(overlays, id);
      return index === -1 ? overlays : overlays.slice(0, index);
    });
  }, []);

  const value = useMemo(
    () => ({ openOverlays, openOverlay, closeOverlay }),
    [openOverlays, openOverlay, closeOverlay],
  );

  return (
    <HeaderOverlayContext.Provider value={value}>
      {children}
    </HeaderOverlayContext.Provider>
  );
};

/** Marks the overlays rendered inside it as children of overlay `id`, which stays open while one of them is open. */
export const HeaderOverlayParent = ({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) => (
  <HeaderOverlayParentContext.Provider value={id}>
    {children}
  </HeaderOverlayParentContext.Provider>
);

export const useHeaderOverlay = () => useContext(HeaderOverlayContext);

export const useHeaderOverlayParentId = () =>
  useContext(HeaderOverlayParentContext);
