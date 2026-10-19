'use client';

import { useHeaderOverlay } from '@web/context/header-overlay-provider';
import { useCallback, useState } from 'react';

/** Open state that lives in the header's shared overlay when `overlayId` is given inside a `HeaderOverlayProvider`, and locally otherwise. */
export const useOverlayOpenState = (overlayId?: string) => {
  const overlay = useHeaderOverlay();
  const [localOpen, setLocalOpen] = useState(false);
  const setActiveId = overlay?.setActiveId;
  const isShared = Boolean(setActiveId && overlayId);
  const open = isShared ? overlay?.activeId === overlayId : localOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!setActiveId || !overlayId) {
        setLocalOpen(next);
        return;
      }

      setActiveId((activeId) => {
        if (next) return overlayId;
        return activeId === overlayId ? null : activeId;
      });
    },
    [setActiveId, overlayId],
  );

  return [open, setOpen] as const;
};
