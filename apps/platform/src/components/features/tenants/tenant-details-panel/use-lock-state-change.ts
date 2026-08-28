'use client';

import type {
  TTenantFieldKey,
  TTenantFieldLocks,
} from '@platform/utils/tenant-field-locks/tenant-field-locks';
import { useLayoutEffect, useRef, useState, type RefObject } from 'react';

const lockedFieldKeysOf = (
  fieldLocks: TTenantFieldLocks,
): TTenantFieldKey[] => {
  return Object.keys(fieldLocks) as TTenantFieldKey[];
};

export type TUseLockStateChangeArgs = {
  panelId: string;
  fieldLocks: TTenantFieldLocks;
  lockedAnnouncement: string;
  unlockedAnnouncement: string;
  onFieldsLocked: (newlyLockedKeys: TTenantFieldKey[]) => void;
};

export type TUseLockStateChangeResult = {
  lockAnnouncement: string;
  fieldsContainerRef: RefObject<HTMLDivElement | null>;
};

/**
 * Tracks the locked-field set across renders (derived-during-render, per
 * React's guidance) so a background poll's lock transition — not user
 * action — announces itself and moves focus onto the fields container only
 * when it fires while focus was already inside the panel.
 */
export const useLockStateChange = ({
  panelId,
  fieldLocks,
  lockedAnnouncement,
  unlockedAnnouncement,
  onFieldsLocked,
}: TUseLockStateChangeArgs): TUseLockStateChangeResult => {
  const lockedFieldKeys = lockedFieldKeysOf(fieldLocks);
  const [renderedLockedFieldsKey, setRenderedLockedFieldsKey] = useState(() =>
    [...lockedFieldKeys].sort().join(','),
  );
  const [lockAnnouncement, setLockAnnouncement] = useState('');
  const [shouldMoveFocusOnTransition, setShouldMoveFocusOnTransition] =
    useState(false);
  const fieldsContainerRef = useRef<HTMLDivElement>(null);
  const isMountRef = useRef(true);

  const nextLockedFieldsKey = [...lockedFieldKeys].sort().join(',');
  if (nextLockedFieldsKey !== renderedLockedFieldsKey) {
    const previousLockedKeys = new Set(
      renderedLockedFieldsKey
        ? (renderedLockedFieldsKey.split(',') as TTenantFieldKey[])
        : [],
    );
    const currentLockedKeys = new Set(lockedFieldKeys);
    const newlyLockedKeys = lockedFieldKeys.filter(
      (key) => !previousLockedKeys.has(key),
    );
    const newlyUnlockedKeys = [...previousLockedKeys].filter(
      (key) => !currentLockedKeys.has(key),
    );
    setRenderedLockedFieldsKey(nextLockedFieldsKey);
    // Set-based, not count-based: a same-count swap (one field locks as
    // another unlocks) must still announce the lock rather than cancel out
    // to nothing.
    if (newlyLockedKeys.length > 0) {
      setLockAnnouncement(lockedAnnouncement);
    } else if (newlyUnlockedKeys.length > 0) {
      setLockAnnouncement(unlockedAnnouncement);
    }
    setShouldMoveFocusOnTransition(
      Boolean(
        document.activeElement?.closest(
          `[data-tenant-details-panel="${panelId}"]`,
        ),
      ),
    );
    if (newlyLockedKeys.length > 0) {
      onFieldsLocked(newlyLockedKeys);
    }
  }

  // A layout effect commits after the live-region text mutation above and
  // before paint, so the focus move lands after that text is in the DOM
  // rather than racing it.
  useLayoutEffect(() => {
    if (isMountRef.current) {
      isMountRef.current = false;
      return;
    }
    if (!shouldMoveFocusOnTransition) {
      return;
    }
    fieldsContainerRef.current?.focus();
  }, [renderedLockedFieldsKey, shouldMoveFocusOnTransition]);

  return { lockAnnouncement, fieldsContainerRef };
};
