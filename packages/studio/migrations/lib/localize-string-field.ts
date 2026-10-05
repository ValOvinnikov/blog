import { at, set, type NodePatch } from 'sanity/migrate';

import { localizedString } from './in-default-locale';

export const localizeStringField = (
  path: Parameters<typeof at>[0],
  value: unknown,
): NodePatch[] =>
  typeof value === 'string' ? [at(path, set(localizedString(value)))] : [];
