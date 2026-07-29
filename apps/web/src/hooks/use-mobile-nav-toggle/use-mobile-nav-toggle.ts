'use client';

import { useEffect, useRef, useState } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const getFocusables = (panel: HTMLElement | null) =>
  Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []);

/**
 * useMobileNavToggle — the same open-state/focus/dismissal contract as
 * `usePopover` (Escape/outside-click dismissal, a Tab focus-trap,
 * Arrow/Home/End roving focus, focus-into-panel on open, focus-return-to-
 * trigger on close), adapted for `PrimaryNavigation`'s `mobileToggle` prop.
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
  const [open, setOpenState] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getPanel = () =>
    containerRef.current?.querySelector<HTMLElement>(`[id="${panelId}"]`) ??
    null;

  const getTrigger = () =>
    containerRef.current?.querySelector<HTMLElement>(
      `[aria-controls="${panelId}"]`,
    ) ?? null;

  const close = () => {
    setOpenState(false);
    getTrigger()?.focus();
  };

  const toggle = () => {
    if (open) {
      close();
      return;
    }

    setOpenState(true);
  };

  useEffect(() => {
    if (!open) return;

    const firstFocusable = getFocusables(getPanel()).at(0);
    firstFocusable?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (containerRef.current?.contains(target)) return;

      close();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
        return;
      }

      const focusable = getFocusables(getPanel());
      const first = focusable.at(0);
      const last = focusable.at(-1);
      if (!first || !last) return;

      const active = document.activeElement;

      if (event.key === 'Tab') {
        if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
        return;
      }

      const currentIndex = focusable.indexOf(active as HTMLElement);

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        const next = focusable[currentIndex + 1] ?? first;
        next.focus();
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        const previous =
          currentIndex <= 0 ? last : (focusable[currentIndex - 1] ?? last);
        previous.focus();
        return;
      }

      if (event.key === 'Home') {
        event.preventDefault();
        first.focus();
        return;
      }

      if (event.key === 'End') {
        event.preventDefault();
        last.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return { open, toggle, close, containerRef };
};
