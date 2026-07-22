'use client';

import { useEffect, useRef, useState } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * usePopover — owns a popover's open state plus every piece of behaviour
 * that needs a real DOM node: focus-into-panel on open, Escape/outside-click
 * dismissal (scoped to `triggerRef`/`panelRef` via `.contains()`, never
 * `document.getElementById`), a Tab focus-trap scoped to `panelRef`, and
 * focus-return-to-trigger on every close path (toggle, Escape, outside-click).
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

      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      const first = focusable.at(0);
      const last = focusable.at(-1);
      if (!first || !last) return;

      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
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
