import type {
  TPersonalDataFallbackReason,
  TPersonalDataOwner,
} from '@blog/db/constants';

export type TPersonalDataFallback = {
  owner: TPersonalDataOwner;
  reason: TPersonalDataFallbackReason;
};

export type TPersonalDataFallbackListener = (
  fallback: TPersonalDataFallback,
) => unknown;

// Keyed on globalThis because Next.js bundles instrumentation.ts separately
// from routes, so a module-level Set would not be shared between them.
const LISTENERS_KEY = Symbol.for('@blog/db/personal-data-fallback-listeners');

function getListeners(): Set<TPersonalDataFallbackListener> {
  const registry = globalThis as typeof globalThis & {
    [LISTENERS_KEY]?: Set<TPersonalDataFallbackListener>;
  };
  registry[LISTENERS_KEY] ??= new Set();

  return registry[LISTENERS_KEY];
}

/** Hears every read that used a plain personal-data column instead of its encrypted or indexed form. */
export function onPersonalDataFallback(
  listener: TPersonalDataFallbackListener,
): () => void {
  const listeners = getListeners();
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function notifyPersonalDataFallback(
  fallback: TPersonalDataFallback,
): void {
  for (const listener of getListeners()) {
    try {
      listener(fallback);
    } catch {
      continue;
    }
  }
}
