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

function normalizeContextValue(value: unknown): unknown {
  if (!(value instanceof Error)) {
    return value;
  }

  const normalized: TLogContext = { message: sanitizeLogMessage(value) };
  if (typeof value.stack === 'string') {
    normalized.stack = truncateStack(value.stack);
  }

  return normalized;
}

function normalizeContext(context: TLogContext): TLogContext {
  const normalized: TLogContext = {};
  for (const [key, value] of Object.entries(context)) {
    normalized[key] = normalizeContextValue(value);
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
