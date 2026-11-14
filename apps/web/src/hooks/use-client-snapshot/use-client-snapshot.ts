'use client';

import { useSyncExternalStore } from 'react';

const subscribeToNothing = () => () => {};

/** Reads a browser-only value after hydration, rendering `serverValue` on the server and during hydration. */
export const useClientSnapshot = <T>(
  getClientValue: () => T,
  serverValue: T,
): T =>
  useSyncExternalStore(subscribeToNothing, getClientValue, () => serverValue);
