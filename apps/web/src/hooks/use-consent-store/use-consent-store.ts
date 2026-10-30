'use client';

import type { TConsentCategory, TMaybeUndefined } from '@blog/config';
import { CONSENT_STATUS, type TConsentStatus } from '@web/constants/consent';
import {
  CONSENT_COOKIE_NAME,
  decodeConsent,
  encodeConsent,
  OPTIONAL_CONSENT_CATEGORIES,
} from '@web/utils/consent-cookie';
import { readCookie } from '@web/utils/read-cookie';
import { useSyncExternalStore } from 'react';

type TConsentStoreStatus = Exclude<
  TConsentStatus,
  typeof CONSENT_STATUS.GRANTED | typeof CONSENT_STATUS.DENIED
>;

type TConsentSnapshot = {
  status: TConsentStoreStatus;
  granted: readonly TConsentCategory[];
  saveRevision: number;
};

const UNKNOWN_SNAPSHOT: TConsentSnapshot = {
  status: CONSENT_STATUS.UNKNOWN,
  granted: [],
  saveRevision: 0,
};

const listeners = new Set<() => void>();
let saveRevision = 0;
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
    ? { status: CONSENT_STATUS.ANSWERED, granted, saveRevision }
    : { status: CONSENT_STATUS.UNANSWERED, granted: [], saveRevision };
};

const getSnapshot = (): TConsentSnapshot => {
  const value = readCookie(document.cookie, CONSENT_COOKIE_NAME);
  if (
    !lastRead ||
    lastRead.value !== value ||
    lastRead.snapshot.saveRevision !== saveRevision
  ) {
    lastRead = { value, snapshot: toSnapshot(value) };
  }
  return lastRead.snapshot;
};

const getServerSnapshot = () => UNKNOWN_SNAPSHOT;

const save = (granted: readonly TConsentCategory[]): number => {
  document.cookie = encodeConsent(granted);
  saveRevision += 1;
  listeners.forEach((listener) => listener());
  return saveRevision;
};

const acceptAll = () => save(OPTIONAL_CONSENT_CATEGORIES);

const rejectAll = () => save([]);

export const useConsentStore = () => {
  const { status, granted, saveRevision } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return { status, granted, saveRevision, save, acceptAll, rejectAll };
};
