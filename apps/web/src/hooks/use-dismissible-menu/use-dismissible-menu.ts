'use client';

import { useCallback, useEffect, useState } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const getFocusables = (panel: HTMLElement | null) =>
  Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []);

export type TDismissibleMenuAccessors = {
  getTrigger: () => HTMLElement | null;
  getPanel: () => HTMLElement | null;
  /**
   * Optional wider "inside" boundary for the outside-click check — a
   * pointer-down anywhere inside `getContainer()` also counts as inside,
   * so a sibling sharing that container never triggers a dismiss.
   */
  getContainer?: () => HTMLElement | null;
  /**
   * When `false`, skips the Tab focus-trap and Arrow/Home/End roving focus
   * (Escape/outside-click still apply). Defaults to `true` for command-style
   * menus; set `false` for a plain in-page navigation disclosure.
   */
  trapFocus?: boolean;
  /**
   * When `true`, closes the menu as soon as focus moves outside both trigger
   * and panel, without returning focus to the trigger. Defaults to `false`.
   * Needed for a non-modal overlay panel left open while focus moves past it
   * (WCAG 2.4.11).
   */
  closeOnFocusOut?: boolean;
};

/**
 * useDismissibleMenu — the shared open-state/focus/dismissal core behind
 * `usePopover` and `useMobileNavToggle`: focus-into-panel on open,
 * Escape/outside-click dismissal, and focus-return-to-trigger on every close
 * path. By default it also layers a Tab focus-trap and Arrow/Home/End
 * roving focus over the panel's focusable items (WAI-ARIA APG menu pattern);
 * `trapFocus: false` opts out of both and keeps ordinary Tab order.
 *
 * Trigger/panel DOM nodes are located through `getTrigger`/`getPanel`
 * accessor callbacks rather than concrete refs, so callers can adapt
 * whatever DOM-lookup strategy fits their markup without duplicating the
 * dismissal/focus-trap/roving-focus logic itself.
 */
export const useDismissibleMenu = ({
  getTrigger,
  getPanel,
  getContainer,
  trapFocus = true,
  closeOnFocusOut = false,
}: TDismissibleMenuAccessors) => {
  const [open, setOpenState] = useState(false);

  const close = useCallback(() => {
    setOpenState(false);
    getTrigger()?.focus();
  }, [getTrigger]);

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
  }, [open, getPanel]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        getPanel()?.contains(target) ||
        getTrigger()?.contains(target) ||
        getContainer?.()?.contains(target)
      ) {
        return;
      }

      close();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
        return;
      }

      if (!trapFocus) return;

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
  }, [open, getPanel, getTrigger, getContainer, close, trapFocus]);

  useEffect(() => {
    if (!open || !closeOnFocusOut) return;

    const panel = getPanel();
    if (!panel) return;

    const handleFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget as Node | null;

      if (
        next === null ||
        getPanel()?.contains(next) ||
        getTrigger()?.contains(next)
      ) {
        return;
      }

      setOpenState(false);
    };

    panel.addEventListener('focusout', handleFocusOut);

    return () => {
      panel.removeEventListener('focusout', handleFocusOut);
    };
  }, [open, closeOnFocusOut, getPanel, getTrigger]);

  return { open, toggle, close };
};
