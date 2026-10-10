import { useSyncExternalStore } from 'react';

const subscribeToVisibilityChange = (onChange: () => void) => {
  document.addEventListener('visibilitychange', onChange);
  return () => document.removeEventListener('visibilitychange', onChange);
};

const isDocumentVisible = () => document.visibilityState !== 'hidden';

const isDocumentVisibleOnServer = () => true;

export const useDocumentVisible = (): boolean =>
  useSyncExternalStore(
    subscribeToVisibilityChange,
    isDocumentVisible,
    isDocumentVisibleOnServer,
  );
