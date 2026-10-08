'use client';

import { type RefObject, useLayoutEffect } from 'react';

/** Freezes the page behind an open panel and caps the panel to the viewport space below its top edge. */
export const usePanelScrollLock = (
  panelRef: RefObject<HTMLElement | null>,
  active: boolean,
) => {
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!active || !panel) return;

    const { style: rootStyle } = document.documentElement;
    const previousOverflow = rootStyle.overflow;
    rootStyle.overflow = 'hidden';
    panel.style.maxHeight = `${window.innerHeight - panel.getBoundingClientRect().top}px`;

    return () => {
      rootStyle.overflow = previousOverflow;
      panel.style.removeProperty('max-height');
    };
  }, [panelRef, active]);
};
