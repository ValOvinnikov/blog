import type { SanityDocument } from '@sanity/client';
import { toPublishedId } from '@shinefold/utils/sanity-document-id';

export function listEditedIds(
  starterDocuments: SanityDocument[],
  pendingIds: string[],
): Set<string> {
  const pending = new Set(pendingIds.map(toPublishedId));

  return new Set(
    starterDocuments
      .filter(
        ({ _id, _createdAt, _updatedAt }) =>
          _updatedAt !== _createdAt || pending.has(_id),
      )
      .map(({ _id }) => _id),
  );
}
