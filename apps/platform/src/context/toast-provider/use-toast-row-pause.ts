'use client';

import { useCallback, useMemo, useRef } from 'react';

interface IRowActivity {
  hover: boolean;
  focus: boolean;
}

/**
 * Tracks per-toast hover/focus activity so `ToastProvider` can pause a
 * toast's dismiss timer while it's being interacted with, and exposes a row
 * registry for the `Esc` shortcut to find the currently focused toast.
 */
export const useToastRowPause = (
  onActivate: (id: string) => void,
  onDeactivate: (id: string) => void,
) => {
  const rowNodes = useRef(new Map<string, HTMLDivElement>());
  const activity = useRef(new Map<string, IRowActivity>());
  const rowRefCallbacks = useRef(
    new Map<string, (node: HTMLDivElement | null) => void>(),
  );

  const setActive = useCallback(
    (id: string, kind: keyof IRowActivity, active: boolean) => {
      const current = activity.current.get(id) ?? {
        hover: false,
        focus: false,
      };
      const wasActive = current.hover || current.focus;
      const next = { ...current, [kind]: active };
      activity.current.set(id, next);

      const isActive = next.hover || next.focus;
      if (wasActive === isActive) return;

      if (isActive) {
        onActivate(id);
      } else {
        onDeactivate(id);
      }
    },
    [onActivate, onDeactivate],
  );

  // Cached per id: a fresh callback identity each render would make React
  // detach/reattach the ref, wiping mid-hover activity for a still-mounted toast.
  const registerRow = useCallback((id: string) => {
    const cached = rowRefCallbacks.current.get(id);
    if (cached) return cached;

    const callback = (node: HTMLDivElement | null) => {
      if (node) {
        rowNodes.current.set(id, node);
        return;
      }

      rowNodes.current.delete(id);
      activity.current.delete(id);
      rowRefCallbacks.current.delete(id);
    };

    rowRefCallbacks.current.set(id, callback);
    return callback;
  }, []);

  const getFocusedRowId = useCallback((activeElement: Node | null) => {
    for (const [id, node] of rowNodes.current) {
      if (node.contains(activeElement)) return id;
    }
    return undefined;
  }, []);

  const handleMouseEnter = useCallback(
    (id: string) => setActive(id, 'hover', true),
    [setActive],
  );
  const handleMouseLeave = useCallback(
    (id: string) => setActive(id, 'hover', false),
    [setActive],
  );
  const handleFocus = useCallback(
    (id: string) => setActive(id, 'focus', true),
    [setActive],
  );
  // Focus moving between two elements inside the same toast (e.g. the
  // action button -> the dismiss button) must not count as leaving.
  const handleBlur = useCallback(
    (id: string, currentTarget: Node, relatedTarget: Node | null) => {
      if (currentTarget.contains(relatedTarget)) return;
      setActive(id, 'focus', false);
    },
    [setActive],
  );

  // Stable object identity (every member is already its own `useCallback`)
  // so consumers can safely put the returned object in an effect's deps
  // array without it re-firing on every render.
  return useMemo(
    () => ({
      registerRow,
      getFocusedRowId,
      handleMouseEnter,
      handleMouseLeave,
      handleFocus,
      handleBlur,
    }),
    [
      registerRow,
      getFocusedRowId,
      handleMouseEnter,
      handleMouseLeave,
      handleFocus,
      handleBlur,
    ],
  );
};
