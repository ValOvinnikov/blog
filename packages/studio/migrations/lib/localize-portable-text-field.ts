import { at, set, type NodePatch } from 'sanity/migrate';

import { inDefaultLocale } from './in-default-locale';

const isUnlocalizedItem = (item: unknown) => {
  const type = (item as { _type?: unknown } | null)?._type;

  return typeof type === 'string' && !type.startsWith('internationalizedArray');
};

const isPortableText = (value: unknown): value is unknown[] =>
  Array.isArray(value) && value.length > 0 && value.every(isUnlocalizedItem);

export const localizePortableTextField = (
  path: Parameters<typeof at>[0],
  value: unknown,
  valueType = 'internationalizedArrayListedTextValue',
): NodePatch[] =>
  isPortableText(value)
    ? [at(path, set(inDefaultLocale(valueType, value)))]
    : [];
