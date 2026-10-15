import type { TLogContext } from '@blog/insight/logger/logger';

export type TLogSink = (line: TLogContext) => unknown;

// Keyed on globalThis because Next.js bundles instrumentation.ts separately
// from routes, so a module-level Set would not be shared between them.
const SINKS_KEY = Symbol.for('@blog/insight/log-sinks');

function getSinks(): Set<TLogSink> {
  const registry = globalThis as typeof globalThis & {
    [SINKS_KEY]?: Set<TLogSink>;
  };
  registry[SINKS_KEY] ??= new Set();

  return registry[SINKS_KEY];
}

export function registerLogSink(sink: TLogSink): () => void {
  const sinks = getSinks();
  sinks.add(sink);

  return () => {
    sinks.delete(sink);
  };
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as PromiseLike<unknown>).then === 'function'
  );
}

function callSinkSafely(sink: TLogSink, line: TLogContext): void {
  try {
    const result = sink(line);
    if (isThenable(result)) {
      result.then(undefined, () => undefined);
    }
  } catch {
    return;
  }
}

export function dispatchToSinks(line: TLogContext): void {
  for (const sink of getSinks()) {
    callSinkSafely(sink, line);
  }
}
