import { at, set, type NodePatch } from 'sanity/migrate';

import { inDefaultLocale } from './in-default-locale';

export const localizeStringField = (
  path: Parameters<typeof at>[0],
  value: unknown,
  valueType = 'internationalizedArrayStringValue',
): NodePatch[] =>
  typeof value === 'string'
    ? [at(path, set(inDefaultLocale(valueType, value)))]
    : [];
