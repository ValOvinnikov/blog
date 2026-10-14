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

export const useLockStateChange = ({
  panelId,
  fieldLocks,
  lockedAnnouncement,
  unlockedAnnouncement,
  onFieldsLocked,
}: TUseLockStateChangeArgs): TUseLockStateChangeResult => {
  const lockedFieldKeys = lockedFieldKeysOf(fieldLocks);
  const sortedLockedFieldKeys = [...lockedFieldKeys].sort();
  const [renderedLockedKeys, setRenderedLockedKeys] = useState(
    sortedLockedFieldKeys,
  );
  const [lockAnnouncement, setLockAnnouncement] = useState('');
  const [shouldMoveFocusOnTransition, setShouldMoveFocusOnTransition] =
    useState(false);
  const fieldsContainerRef = useRef<HTMLDivElement>(null);

  const hasLockSetChanged =
    sortedLockedFieldKeys.length !== renderedLockedKeys.length ||
    sortedLockedFieldKeys.some(
      (key, index) => key !== renderedLockedKeys[index],
    );
  if (hasLockSetChanged) {
    const previousLockedKeys = new Set(renderedLockedKeys);
    const currentLockedKeys = new Set(lockedFieldKeys);
    const newlyLockedKeys = lockedFieldKeys.filter(
      (key) => !previousLockedKeys.has(key),
    );
    const newlyUnlockedKeys = renderedLockedKeys.filter(
      (key) => !currentLockedKeys.has(key),
    );
    setRenderedLockedKeys(sortedLockedFieldKeys);
    setShouldMoveFocusOnTransition(
      Boolean(
        document.activeElement?.closest(
          `[data-tenant-details-panel="${panelId}"]`,
        ),
      ),
    );
    if (newlyLockedKeys.length > 0) {
      setLockAnnouncement(lockedAnnouncement);
      onFieldsLocked(newlyLockedKeys);
    } else if (newlyUnlockedKeys.length > 0) {
      setLockAnnouncement(unlockedAnnouncement);
    }
  }

  // A layout effect moves focus before paint, after the live-region text is in the DOM.
  useLayoutEffect(() => {
    if (!shouldMoveFocusOnTransition) {
      return;
    }
    fieldsContainerRef.current?.focus();
  }, [renderedLockedKeys, shouldMoveFocusOnTransition]);

  return { lockAnnouncement, fieldsContainerRef };
};
