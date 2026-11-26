import { isNull } from './null';

/** Assumes SCREAMING_SNAKE_CASE input (this repo's UPPERCASE const-value convention). */
export const toTitleCase = (value: string): string =>
  value
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');

export const toOptions = <TValue extends string>(
  vocabulary: Record<string, TValue>,
  toLabel: (value: TValue) => string,
): { value: TValue; label: string }[] =>
  Object.values(vocabulary).map((value) => ({ value, label: toLabel(value) }));

export const isPlainObject = (
  value: unknown,
): value is Record<string, unknown> =>
  typeof value === 'object' && !isNull(value) && !Array.isArray(value);
