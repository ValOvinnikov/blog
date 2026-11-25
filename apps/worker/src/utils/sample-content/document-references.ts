import type { SanityDocument } from '@sanity/client';
import { isPlainObject, isString } from '@shinefold/utils/primitives';

type TArrayItem = { field: string; key: string; targetIds: string[] };

export type TDocumentReference = {
  targetId: string;
  arrayItem?: TArrayItem;
};

function collectReferenceIds(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(collectReferenceIds);
  if (!isPlainObject(value)) return [];

  const { _ref, ...fields } = value;

  return [
    ...(isString(_ref) ? [_ref] : []),
    ...Object.values(fields).flatMap(collectReferenceIds),
  ];
}

function listArrayReferences(
  field: string,
  items: unknown[],
): TDocumentReference[] {
  return items.flatMap((item) => {
    const targetIds = collectReferenceIds(item);
    if (!isPlainObject(item) || !isString(item._key)) {
      return targetIds.map((targetId) => ({ targetId }));
    }

    const arrayItem = { field, key: item._key, targetIds };

    return targetIds.map((targetId) => ({ targetId, arrayItem }));
  });
}

export function listDocumentReferences(
  document: SanityDocument,
): TDocumentReference[] {
  return Object.entries(document).flatMap(([field, value]) =>
    Array.isArray(value)
      ? listArrayReferences(field, value)
      : collectReferenceIds(value).map((targetId) => ({ targetId })),
  );
}
