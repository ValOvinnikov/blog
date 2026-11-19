import type { SanityDocument } from '@sanity/client';
import { toPublishedId } from '@shinefold/utils/sanity-document-id';

const VERSION_ID_PREFIX = 'versions.';

function toBaseId(id: string): string {
  return id.startsWith(VERSION_ID_PREFIX)
    ? id.split('.').slice(2).join('.')
    : toPublishedId(id);
}

export function listEditedIds(
  starterDocuments: SanityDocument[],
  pendingIds: string[],
): Set<string> {
  const pending = new Set(pendingIds.map(toBaseId));

  return new Set(
    starterDocuments
      .filter(
        ({ _id, _createdAt, _updatedAt }) =>
          _updatedAt !== _createdAt || pending.has(_id),
      )
      .map(({ _id }) => _id),
  );
}
