'use client';

import { useDismissibleMenu } from '@web/hooks/use-dismissible-menu';
import { useCallback, useRef } from 'react';

/**
 * useMobileNavToggle — thin adapter over `useDismissibleMenu` (the shared
 * Escape/outside-click/focus-trap/roving-focus core, also consumed by
 * `usePopover`), adapted for `PrimaryNavigation`'s `mobileToggle` prop.
 *
 * `PrimaryNavigation` renders the toggle button and dropdown panel itself
 * and doesn't forward refs for either, so this hook can't wire separate
 * `triggerRef`/`panelRef` the way `usePopover` does. Instead the caller wraps
 * the whole `PrimaryNavigation` tree in one element and passes its ref here
 * as `containerRef`; the toggle/panel are then located *inside* that ref via
 * the `panelId` that already links the toggle's `aria-controls` to the
 * panel's `id` — every lookup stays scoped to `containerRef.current`, never
 * `document`.
 */
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

  const { open, toggle, close } = useDismissibleMenu({ getTrigger, getPanel });

  return { open, toggle, close, containerRef };
};
