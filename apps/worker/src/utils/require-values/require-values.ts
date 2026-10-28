import type { TMaybeUndefined } from '@blog/config';
import { FatalError } from 'workflow';

function requireValue(name: string, value: TMaybeUndefined<string>): string {
  if (!value) {
    throw new FatalError(`worker: missing required env var ${name}.`);
  }
  return value;
}

export function requireValues<TName extends string>(
  values: Record<TName, TMaybeUndefined<string>>,
): Record<TName, string> {
  const names = Object.keys(values) as TName[];
  return Object.fromEntries(
    names.map((name) => [name, requireValue(name, values[name])]),
  ) as Record<TName, string>;
}
