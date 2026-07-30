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
  /**
   * When `false`, skips the Tab focus-trap and the Arrow/Home/End
   * roving-focus handling entirely — Escape-to-close and
   * outside-click-to-close still apply regardless. Defaults to `true`
   * (the existing WAI-ARIA APG menu pattern), which is correct for
   * command-style menus like `usePopover`'s (`PostShare`'s "Copy link" /
   * share actions) and `useMobileNavToggle`'s (`SiteNavigation`'s mobile
   * dropdown). Set to `false` for a non-modal, in-page navigation
   * disclosure — e.g. `PostContentsRail`'s mobile panel — where ordinary
   * Tab order should carry focus through the panel's links and straight
   * on into the page afterward, not get trapped cycling inside it.
   */
  trapFocus?: boolean;
  /**
   * When `true`, closes the menu as soon as focus moves to an element
   * outside both the trigger and the panel — without returning focus to the
   * trigger, since focus has already moved somewhere else on purpose (e.g.
   * a Tab that carried focus past the panel's last item). Defaults to
   * `false`, so every existing caller (`usePopover`'s `PostShare`,
   * `useMobileNavToggle`'s `SiteNavigation`) keeps its current behaviour —
   * open until Escape, outside-click, or toggle. Pass `true` for a
   * non-modal, `position: sticky` overlay panel — e.g.
   * `PostContentsRail`'s mobile disclosure — where an opaque panel left open
   * while focus moves past it would leave a sighted keyboard user's focus
   * indicator hidden underneath it (WCAG 2.4.11).
   */
  closeOnFocusOut?: boolean;
};

/**
 * useDismissibleMenu — the shared open-state/focus/dismissal core behind
 * `usePopover` and `useMobileNavToggle`: focus-into-panel on open,
 * Escape/outside-click dismissal, and focus-return-to-trigger on every close
 * path (toggle, Escape, outside-click). By default (`trapFocus: true`) it
 * also layers a Tab focus-trap scoped to the panel and ArrowUp/ArrowDown/
 * Home/End roving focus over the panel's focusable items (WAI-ARIA APG menu
 * pattern) — pass `trapFocus: false` to opt out of both and keep ordinary
 * Tab order instead.
 *
 * Trigger/panel DOM nodes are located through `getTrigger`/`getPanel`
 * accessor callbacks rather than concrete refs, so callers can adapt
 * whatever DOM-lookup strategy fits their markup — two forwarded refs
 * (`usePopover`) or a single container ref scoped by `querySelector`
 * (`useMobileNavToggle`) — without duplicating the dismissal/focus-trap/
 * roving-focus logic itself.
 *
 * Tab decision (`trapFocus: true`, the default): Tab deliberately stays
 * trapped inside the panel (dialog-style wrap, not "Tab exits the menu").
 * This is a conscious choice, not an oversight — it preserves the existing
 * dismissal/focus-return behaviour (and the tests that pin it) while
 * Arrow/Home/End layer standard menu roving on top.
 *
 * `closeOnFocusOut` is the opt-in counterpart for `trapFocus: false`
 * panels that render as an opaque overlay over content that keeps its
 * ordinary Tab order underneath — it closes the panel the moment focus
 * genuinely leaves it (guarding the transient `relatedTarget === null` blur
 * and focus moving within the panel/to the trigger), via `setOpenState`
 * directly rather than `close()`, so it never fights the Tab that's already
 * carrying focus onward.
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
