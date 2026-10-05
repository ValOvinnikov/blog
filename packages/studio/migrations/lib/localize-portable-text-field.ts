import { at, set, type NodePatch } from 'sanity/migrate';

import { inDefaultLocale } from './in-default-locale';

const isPortableText = (value: unknown): value is unknown[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every(
    (item) => (item as { _type?: unknown } | null)?._type === 'block',
  );

export const localizePortableTextField = (
  path: Parameters<typeof at>[0],
  value: unknown,
): NodePatch[] =>
  isPortableText(value)
    ? [
        at(
          path,
          set(inDefaultLocale('internationalizedArrayListedTextValue', value)),
        ),
      ]
    : [];
