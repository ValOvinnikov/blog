'use client';

import { useDismissibleMenu } from '@web/hooks/use-dismissible-menu';
import { useCallback, useRef } from 'react';

/** Dismiss behaviour for `PrimaryNavigation`, which forwards no refs, located through one wrapping `containerRef`. */
export const useMobileNavToggle = (panelId: string) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const getPanel = useCallback(
    () =>
      containerRef.current?.querySelector<HTMLElement>(`[id="${panelId}"]`) ??
      null,
    [panelId],
  );

  const getTrigger = useCallback(
    () =>
      containerRef.current?.querySelector<HTMLElement>(
        `[aria-controls="${panelId}"]`,
      ) ?? null,
    [panelId],
  );

  const getContainer = useCallback(() => containerRef.current, []);

  const { open, toggle, close } = useDismissibleMenu({
    getTrigger,
    getPanel,
    getContainer,
    overlayId: panelId,
  });

  return { open, toggle, close, containerRef };
};
