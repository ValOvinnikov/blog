import { normalizeContext } from '@blog/insight/logger/normalize-context';
import { dispatchToSinks } from '@blog/insight/sink/log-sink';

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

function emit(
  consoleMethod: (message: string) => void,
  level: TLogLevel,
  event: string,
  baseContext: TLogContext,
  context?: TLogContext,
): TLogContext {
  const line = {
    ...normalizeContext(baseContext),
    ...(context ? normalizeContext(context) : {}),
    level,
    event,
    ts: new Date().toISOString(),
  };

  consoleMethod(JSON.stringify(line));

  return line;
}

export function createLogger(baseContext: TLogContext = {}): ILogger {
  return {
    error(event, context) {
      dispatchToSinks(
        emit(console.error, LOG_LEVEL.ERROR, event, baseContext, context),
      );
    },
    warn(event, context) {
      dispatchToSinks(
        emit(console.warn, LOG_LEVEL.WARN, event, baseContext, context),
      );
    },
    info(event, context) {
      emit(console.info, LOG_LEVEL.INFO, event, baseContext, context);
    },
    debug(event, context) {
      if (process.env.NODE_ENV === 'production') {
        return;
      }

      emit(console.debug, LOG_LEVEL.DEBUG, event, baseContext, context);
    },
  };
}
