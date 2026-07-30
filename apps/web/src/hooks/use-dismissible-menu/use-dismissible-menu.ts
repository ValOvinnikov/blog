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
   * Optional wider "inside" boundary for the outside-click check. When
   * provided, a pointer-down anywhere inside `getContainer()` counts as
   * inside — not just inside the resolved trigger/panel — so sibling
   * elements sharing that container (e.g. `SiteNavigation`'s always-visible
   * `actions` slot) never trigger a dismiss. Omit it to keep the narrower
   * trigger/panel-only scoping (`usePopover`'s behaviour, which never had a
   * wider container to begin with).
   */
  getContainer?: () => HTMLElement | null;
};

/**
 * useDismissibleMenu — the shared open-state/focus/dismissal core behind
 * `usePopover` and `useMobileNavToggle`: focus-into-panel on open,
 * Escape/outside-click dismissal, a Tab focus-trap scoped to the panel,
 * ArrowUp/ArrowDown/Home/End roving focus over the panel's focusable items
 * (WAI-ARIA APG menu pattern), and focus-return-to-trigger on every close
 * path (toggle, Escape, outside-click).
 *
 * Trigger/panel DOM nodes are located through `getTrigger`/`getPanel`
 * accessor callbacks rather than concrete refs, so callers can adapt
 * whatever DOM-lookup strategy fits their markup — two forwarded refs
 * (`usePopover`) or a single container ref scoped by `querySelector`
 * (`useMobileNavToggle`) — without duplicating the dismissal/focus-trap/
 * roving-focus logic itself.
 *
 * Tab decision: Tab deliberately stays trapped inside the panel (dialog-
 * style wrap, not "Tab exits the menu"). This is a conscious choice, not an
 * oversight — it preserves the existing dismissal/focus-return behaviour
 * (and the tests that pin it) while Arrow/Home/End layer standard menu
 * roving on top.
 */
export const useDismissibleMenu = ({
  getTrigger,
  getPanel,
  getContainer,
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
  }, [open, getPanel, getTrigger, getContainer, close]);

  return { open, toggle, close };
};
