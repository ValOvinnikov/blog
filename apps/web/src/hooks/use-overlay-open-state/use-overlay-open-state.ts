'use client';

import {
  useHeaderOverlay,
  useHeaderOverlayParentId,
} from '@web/context/header-overlay-provider';
import { useCallback, useState } from 'react';

export type TOverlayOpenStateOptions = {
  overlayId?: string;
  takesKeys?: boolean;
};

/** Open state that lives in the header's shared overlay when `overlayId` is given inside a `HeaderOverlayProvider`, and locally otherwise. */
export const useOverlayOpenState = ({
  overlayId,
  takesKeys = false,
}: TOverlayOpenStateOptions = {}) => {
  const overlay = useHeaderOverlay();
  const parentId = useHeaderOverlayParentId();
  const [localOpen, setLocalOpen] = useState(false);
  const openOverlay = overlay?.openOverlay;
  const closeOverlay = overlay?.closeOverlay;
  const openOverlays = overlay?.openOverlays ?? [];
  const isShared = Boolean(overlay && overlayId);
  const ownIndex = openOverlays.findIndex(({ id }) => id === overlayId);
  const open = isShared ? ownIndex !== -1 : localOpen;
  const frontOverlay = openOverlays.at(-1);
  const hasChildTakingKeys =
    open &&
    isShared &&
    frontOverlay?.id !== overlayId &&
    Boolean(frontOverlay?.takesKeys);

  const setOpen = useCallback(
    (next: boolean) => {
      if (!openOverlay || !closeOverlay || !overlayId) {
        setLocalOpen(next);
        return;
      }

      if (next) {
        openOverlay({ id: overlayId, takesKeys }, parentId);
        return;
      }

      closeOverlay(overlayId);
    },
    [openOverlay, closeOverlay, overlayId, takesKeys, parentId],
  );

  return [open, setOpen, hasChildTakingKeys] as const;
};
