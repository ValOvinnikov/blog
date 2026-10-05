import { at, set, type NodePatch } from 'sanity/migrate';

import { localizedString } from './in-default-locale';

export const localizeStringField = (
  field: string,
  value: unknown,
): NodePatch[] =>
  typeof value === 'string' ? [at(field, set(localizedString(value)))] : [];
