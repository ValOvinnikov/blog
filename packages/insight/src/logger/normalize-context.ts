import type { TLogContext } from '@blog/insight/logger/logger';
import { sanitizeLogMessage } from '@blog/insight/utils/sanitize-log-message';

// Well under Vercel's few-KB line cut, which would otherwise split the JSON.
const MAX_STACK_LENGTH = 4000;
const STACK_TRUNCATION_MARKER = '...[truncated]';

function truncateStack(stack: string): string {
  if (stack.length <= MAX_STACK_LENGTH) {
    return stack;
  }

  return stack.slice(0, MAX_STACK_LENGTH) + STACK_TRUNCATION_MARKER;
}

// Deep enough to find an Error nested a few layers down, e.g. `{ details: { cause } }`.
const MAX_NORMALIZE_DEPTH = 5;
const DEPTH_LIMIT_MARKER = '[MaxDepthExceeded]';
const CIRCULAR_MARKER = '[Circular]';

const ERROR_STRING_PROPERTIES = ['digest', 'code'] as const;

function normalizeError(error: Error): TLogContext {
  const normalized: TLogContext = {
    name: sanitizeLogMessage(error.name),
    message: sanitizeLogMessage(error),
  };
  for (const property of ERROR_STRING_PROPERTIES) {
    const value: unknown = Reflect.get(error, property);
    if (typeof value === 'string') {
      normalized[property] = sanitizeLogMessage(value);
    }
  }
  if (typeof error.stack === 'string') {
    normalized.stack = truncateStack(error.stack);
  }

  return normalized;
}

function isPlainObject(value: object): boolean {
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

// JSON.stringify escapes \x00-\x1f itself but leaves U+2028/U+2029 raw.
function escapeLineSeparators(text: string): string {
  return text.replace(/[\u2028\u2029]/g, ' ');
}

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

export function normalizeContext(context: TLogContext): TLogContext {
  const normalized: TLogContext = {};
  const ancestors = new Set<object>();
  for (const [key, value] of Object.entries(context)) {
    normalized[key] = normalizeContextValue(value, 0, ancestors);
  }

  return normalized;
}
