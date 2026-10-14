'use client';

import type { TConsentCategory, TMaybeUndefined } from '@blog/config';
import {
  CONSENT_COOKIE_NAME,
  decodeConsent,
  encodeConsent,
  OPTIONAL_CONSENT_CATEGORIES,
} from '@web/utils/consent-cookie';
import { readCookie } from '@web/utils/read-cookie';
import { useSyncExternalStore } from 'react';

export type TConsentStatus = 'unknown' | 'unanswered' | 'answered';

type TConsentSnapshot = {
  status: TConsentStatus;
  granted: readonly TConsentCategory[];
};

const UNKNOWN_SNAPSHOT: TConsentSnapshot = { status: 'unknown', granted: [] };

const listeners = new Set<() => void>();
let lastRead: TMaybeUndefined<{
  value: TMaybeUndefined<string>;
  snapshot: TConsentSnapshot;
}>;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const toSnapshot = (value: TMaybeUndefined<string>): TConsentSnapshot => {
  const granted = decodeConsent(value);
  return granted
    ? { status: 'answered', granted }
    : { status: 'unanswered', granted: [] };
};

const getSnapshot = (): TConsentSnapshot => {
  const value = readCookie(document.cookie, CONSENT_COOKIE_NAME);
  if (!lastRead || lastRead.value !== value) {
    lastRead = { value, snapshot: toSnapshot(value) };
  }
  return lastRead.snapshot;
};

const getServerSnapshot = () => UNKNOWN_SNAPSHOT;

const save = (granted: readonly TConsentCategory[]) => {
  document.cookie = encodeConsent(granted);
  listeners.forEach((listener) => listener());
};

const acceptAll = () => save(OPTIONAL_CONSENT_CATEGORIES);

const rejectAll = () => save([]);

export const useConsentStore = () => {
  const { status, granted } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return { status, granted, save, acceptAll, rejectAll };
};
