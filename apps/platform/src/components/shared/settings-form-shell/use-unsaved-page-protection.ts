import {
  useUnsavedChangesGuard,
  type TUnsavedChangesGuard,
} from '@platform/context/unsaved-changes-provider';
import { useEffect, useEffectEvent } from 'react';

type TUnsavedPageProtection = TUnsavedChangesGuard & {
  isPending: boolean;
};

const isSaveShortcut = (event: KeyboardEvent) =>
  (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's';

export const useUnsavedPageProtection = ({
  isPending,
  ...guard
}: TUnsavedPageProtection) => {
  const isDirty = guard.changeCount > 0;

  useUnsavedChangesGuard(isDirty ? guard : null);

  const handleShortcut = useEffectEvent((event: KeyboardEvent) => {
    if (!isSaveShortcut(event)) return;
    event.preventDefault();
    if (!isPending) void guard.save();
  });

  useEffect(() => {
    if (!isDirty) return;

    const handleKeyDown = (event: KeyboardEvent) => handleShortcut(event);
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);
};
