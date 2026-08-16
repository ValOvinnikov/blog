'use client';

import { useCallback, useMemo, useRef } from 'react';

interface IRowActivity {
  hover: boolean;
  focus: boolean;
}

/**
 * useToastRowPause — the per-row hover/focus-within pause-resume sub-flow
 * behind `ToastProvider`'s toast rows (§4.3): tracks hover and keyboard
 * focus as two independent flags per toast id and calls `onActivate`/
 * `onDeactivate` only on the 0↔1 transition of "either is active", not on
 * every individual enter/leave/focus/blur event. This matters because the
 * two can overlap — e.g. the mouse hovers a toast, focus then tabs into its
 * action button, and the mouse leaves without focus moving: the toast must
 * stay paused (focus is still inside) until focus *also* leaves, not resume
 * the instant the mouse does.
 *
 * Also owns the row DOM node registry used to find which toast (if any)
 * currently holds focus (`getFocusedRowId`, for the `Esc` shortcut) —
 * registration and activity tracking are cleaned up together the moment a
 * row unmounts (`registerRow`'s ref callback fires with `null`), so neither
 * map grows unbounded over a long session.
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

  // A per-id ref callback is cached and reused across renders — a plain
  // inline `(node) => registerRow(id)(node)` would return a *new* function
  // identity on every render, and React detaches (`null`) + reattaches a
  // callback ref whenever its identity changes, not just on real
  // mount/unmount. That churn would silently wipe `activity`'s entry for a
  // still-mounted toast the instant any re-render happened between a
  // `mouseenter` and the matching `mouseleave` (exactly what a `pause()`-
  // triggered re-render does), losing track of the hover flag entirely.
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
