import type { TConsentCategory } from '@blog/config';
import {
  readConsentCookieValue,
  serializeConsentCookie,
} from '@web/utils/consent-cookie';

const listeners = new Set<() => void>();

export const subscribeToConsent = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getConsentSnapshot = (): string =>
  readConsentCookieValue(document.cookie);

export const getServerConsentSnapshot = (): null => null;

export const writeConsent = (granted: readonly TConsentCategory[]): void => {
  document.cookie = serializeConsentCookie(granted);
  listeners.forEach((listener) => listener());
};
