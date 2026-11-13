import { useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();
let isPageOutOfDate = false;

export const markPageOutOfDate = () => {
  isPageOutOfDate = true;
  listeners.forEach((notify) => notify());
};

const subscribeToPageOutOfDate = (onChange: () => void) => {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
};

const readIsPageOutOfDate = () => isPageOutOfDate;

const readIsPageOutOfDateOnServer = () => false;

export const useIsPageOutOfDate = (): boolean =>
  useSyncExternalStore(
    subscribeToPageOutOfDate,
    readIsPageOutOfDate,
    readIsPageOutOfDateOnServer,
  );
