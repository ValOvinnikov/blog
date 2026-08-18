import { sanitizeLogMessage } from '../utils/sanitize-log-message';

/**
 * Local to `@blog/insight` rather than `@blog/config`: this package sits at
 * the base of the dependency graph alongside `@blog/config`, so importing
 * config's constants here would add a dependency where none is needed.
 * Values stay lowercase (breaking the repo's usual UPPERCASE-value
 * convention) because log aggregators expect lowercase severity strings.
 */
export const LOG_LEVEL = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
} as const;

export type TLogLevel = (typeof LOG_LEVEL)[keyof typeof LOG_LEVEL];

export type TLogContext = Record<string, unknown>;

export interface ILogger {
  error(event: string, context?: TLogContext): void;
  warn(event: string, context?: TLogContext): void;
  info(event: string, context?: TLogContext): void;
  debug(event: string, context?: TLogContext): void;
}

// Vercel truncates individual log lines at a few KB after we emit valid
// JSON; an uncapped stack risks that post-emission cut landing mid-structure,
// so it's capped well under that budget before it ever reaches JSON.stringify.
const MAX_STACK_LENGTH = 4000;
const STACK_TRUNCATION_MARKER = '...[truncated]';

function truncateStack(stack: string): string {
  if (stack.length <= MAX_STACK_LENGTH) {
    return stack;
  }

  return stack.slice(0, MAX_STACK_LENGTH) + STACK_TRUNCATION_MARKER;
}

// Small on purpose: real context objects are a handful of levels deep, and
// this only needs to be generous enough to find an Error a caller nested a
// couple of layers down (e.g. `{ details: { cause: err } }`).
const MAX_NORMALIZE_DEPTH = 5;
const DEPTH_LIMIT_MARKER = '[MaxDepthExceeded]';
const CIRCULAR_MARKER = '[Circular]';

function normalizeError(error: Error): TLogContext {
  const normalized: TLogContext = { message: sanitizeLogMessage(error) };
  if (typeof error.stack === 'string') {
    normalized.stack = truncateStack(error.stack);
  }

  return normalized;
}

function isPlainObject(value: object): boolean {
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

// JSON.stringify does not escape U+2028/U+2029, so a raw one in any string
// context value (not just an Error's message) could be mistaken for a line
// break by a naive log-line splitter. Unlike sanitizeLogMessage, this does
// NOT strip the \x00-\x1f/\x7f range: JSON.stringify already escapes those,
// and stripping them here would mangle legitimate multi-line string content.
function escapeLineSeparators(text: string): string {
  return text.replace(/[\u2028\u2029]/g, ' ');
}

// Recurses into plain objects/arrays only, so a nested Error is found and
// unwrapped wherever a caller put it (not just at the top level). Depth is
// bounded and visited ancestors are tracked so a cyclic context object
// degrades to a marker instead of hanging or crashing JSON.stringify.
function normalizeContextValue(
  value: unknown,
  depth: number,
  ancestors: Set<object>,
): unknown {
  if (value instanceof Error) {
    return normalizeError(value);
  }

  if (typeof value === 'string') {
    return escapeLineSeparators(value);
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  const isArray = Array.isArray(value);
  if (!isArray && !isPlainObject(value)) {
    return value;
  }

  if (ancestors.has(value)) {
    return CIRCULAR_MARKER;
  }

  if (depth >= MAX_NORMALIZE_DEPTH) {
    return DEPTH_LIMIT_MARKER;
  }

  ancestors.add(value);
  const normalized = isArray
    ? value.map((item) => normalizeContextValue(item, depth + 1, ancestors))
    : Object.fromEntries(
        Object.entries(value as TLogContext).map(([key, nested]) => [
          key,
          normalizeContextValue(nested, depth + 1, ancestors),
        ]),
      );
  ancestors.delete(value);

  return normalized;
}

function normalizeContext(context: TLogContext): TLogContext {
  const normalized: TLogContext = {};
  const ancestors = new Set<object>();
  for (const [key, value] of Object.entries(context)) {
    normalized[key] = normalizeContextValue(value, 0, ancestors);
  }

  return normalized;
}

function emit(
  consoleMethod: (message: string) => void,
  level: TLogLevel,
  event: string,
  baseContext: TLogContext,
  context?: TLogContext,
): void {
  const line = {
    ...normalizeContext(baseContext),
    ...(context ? normalizeContext(context) : {}),
    level,
    event,
    ts: new Date().toISOString(),
  };

  consoleMethod(JSON.stringify(line));
}

export function createLogger(baseContext: TLogContext = {}): ILogger {
  return {
    error(event, context) {
      emit(console.error, LOG_LEVEL.ERROR, event, baseContext, context);
    },
    warn(event, context) {
      emit(console.warn, LOG_LEVEL.WARN, event, baseContext, context);
    },
    info(event, context) {
      // eslint-disable-next-line no-console -- structured stdout logging is this module's job
      emit(console.info, LOG_LEVEL.INFO, event, baseContext, context);
    },
    debug(event, context) {
      if (process.env.NODE_ENV === 'production') {
        return;
      }

      // eslint-disable-next-line no-console -- structured stdout logging is this module's job
      emit(console.debug, LOG_LEVEL.DEBUG, event, baseContext, context);
    },
  };
}
