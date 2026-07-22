'use client';

import { useEffect, useRef, useState } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const getFocusables = (panel: HTMLElement | null) =>
  Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []);

/**
 * usePopover — owns a popover's open state plus every piece of behaviour
 * that needs a real DOM node: focus-into-panel on open, Escape/outside-click
 * dismissal (scoped to `triggerRef`/`panelRef` via `.contains()`, never
 * `document.getElementById`), a Tab focus-trap scoped to `panelRef`,
 * ArrowUp/ArrowDown/Home/End roving focus over the panel's focusable items
 * (WAI-ARIA APG menu pattern), and focus-return-to-trigger on every close
 * path (toggle, Escape, outside-click).
 *
 * Tab decision: Tab deliberately stays trapped inside the panel (dialog-
 * style wrap, not "Tab exits the menu"). This is a conscious choice, not an
 * oversight — it preserves the existing dismissal/focus-return behaviour
 * (and the tests that pin it) while Arrow/Home/End layer standard menu
 * roving on top.
 *
 * The caller wires `triggerRef` onto `PopoverMenu.Trigger`'s `ref` and
 * `panelRef` onto `PopoverMenu.Panel`'s `ref`.
 */
export const usePopover = () => {
  const [open, setOpenState] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = () => {
    setOpenState(false);
    triggerRef.current?.focus();
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

    const firstFocusable =
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    firstFocusable?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        panelRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
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

      const focusable = getFocusables(panelRef.current);
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
  }, [open]);

  return { open, toggle, triggerRef, panelRef };
};
