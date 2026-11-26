'use client';

import type { TMaybeNull } from '@shinefold/config';
import { useCallback, useMemo, useRef } from 'react';

interface IRowActivity {
  hover: boolean;
  focus: boolean;
}

/** Pauses a toast while it is hovered or holds focus, resuming only once both have left. */
export const useToastRowPause = (
  onActivate: (id: string) => void,
  onDeactivate: (id: string) => void,
) => {
  const rowNodes = useRef(new Map<string, HTMLDivElement>());
  const activity = useRef(new Map<string, IRowActivity>());
  const rowRefCallbacks = useRef(
    new Map<string, (node: TMaybeNull<HTMLDivElement>) => void>(),
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

  // Cached per id: a fresh callback identity makes React detach the ref and wipe the row's activity.
  const registerRow = useCallback((id: string) => {
    const cached = rowRefCallbacks.current.get(id);
    if (cached) return cached;

    const callback = (node: TMaybeNull<HTMLDivElement>) => {
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

  const getFocusedRowId = useCallback((activeElement: TMaybeNull<Node>) => {
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
  // Focus moving between elements inside the same toast is not leaving it.
  const handleBlur = useCallback(
    (id: string, currentTarget: Node, relatedTarget: TMaybeNull<Node>) => {
      if (currentTarget.contains(relatedTarget)) return;
      setActive(id, 'focus', false);
    },
    [setActive],
  );

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
