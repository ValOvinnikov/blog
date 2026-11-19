import type { SanityDocument } from '@sanity/client';
import { STARTER_DOCUMENT_IDS } from '@shinefold/config';
import { hasArrayGotItems, isUndefined } from '@shinefold/utils/primitives';

import {
  listDocumentReferences,
  type TDocumentReference,
} from './document-references';
import { listEditedIds } from './edited-samples';

export type TSampleContentSnapshot = {
  starterDocuments: SanityDocument[];
  pendingIds: string[];
  referrers: SanityDocument[];
};

type TSampleContentUnlink = {
  documentId: string;
  revision: string;
  field: string;
  keys: string[];
};

export type TSampleContentRemovalPlan = {
  removeIds: string[];
  unlinks: TSampleContentUnlink[];
  keptEdited: string[];
  keptReferenced: string[];
};

const MODULES_FIELD = 'modules';

const UNLINKABLE_FIELD_BY_DOCUMENT_ID: Record<string, string> = {
  [STARTER_DOCUMENT_IDS.HOME_TEMPLATE]: MODULES_FIELD,
  [STARTER_DOCUMENT_IDS.POST_INDEX_TEMPLATE]: MODULES_FIELD,
  [STARTER_DOCUMENT_IDS.NAVIGATION]: 'items',
};

type TOutsideReference = {
  document: SanityDocument;
  reference: TDocumentReference;
};

function listOutsideReferences(
  documents: SanityDocument[],
  removable: Set<string>,
): TOutsideReference[] {
  return documents
    .filter((document) => !removable.has(document._id))
    .flatMap((document) =>
      listDocumentReferences(document)
        .filter((reference) => removable.has(reference.targetId))
        .map((reference) => ({ document, reference })),
    );
}

function isUnlinkable(
  { document, reference: { arrayItem } }: TOutsideReference,
  removable: Set<string>,
): boolean {
  return (
    !isUndefined(arrayItem) &&
    UNLINKABLE_FIELD_BY_DOCUMENT_ID[document._id] === arrayItem.field &&
    arrayItem.targetIds.every((id) => removable.has(id))
  );
}

function listUnlinks(
  outsideReferences: TOutsideReference[],
): TSampleContentUnlink[] {
  const unlinks = new Map<string, TSampleContentUnlink>();
  const arrayItems = outsideReferences.flatMap(
    ({ document, reference: { arrayItem } }) =>
      arrayItem ? [{ document, arrayItem }] : [],
  );
  for (const { document, arrayItem } of arrayItems) {
    const { field, key } = arrayItem;
    const unlink = unlinks.get(document._id) ?? {
      documentId: document._id,
      revision: document._rev,
      field,
      keys: [],
    };
    if (!unlink.keys.includes(key)) unlink.keys.push(key);
    unlinks.set(document._id, unlink);
  }

  return [...unlinks.values()];
}

export function planSampleContentRemoval({
  starterDocuments,
  pendingIds,
  referrers,
}: TSampleContentSnapshot): TSampleContentRemovalPlan {
  const edited = listEditedIds(starterDocuments, pendingIds);
  const removable = new Set(
    starterDocuments.map(({ _id }) => _id).filter((id) => !edited.has(id)),
  );
  const documents = [...referrers, ...starterDocuments];
  const keptReferenced: string[] = [];

  let blockedIds: string[];
  do {
    blockedIds = listOutsideReferences(documents, removable)
      .filter((outside) => !isUnlinkable(outside, removable))
      .map(({ reference }) => reference.targetId);
    for (const id of new Set(blockedIds)) {
      removable.delete(id);
      keptReferenced.push(id);
    }
  } while (hasArrayGotItems(blockedIds));

  return {
    removeIds: [...removable].sort(),
    unlinks: listUnlinks(listOutsideReferences(documents, removable)),
    keptEdited: [...edited].sort(),
    keptReferenced: keptReferenced.sort(),
  };
}
