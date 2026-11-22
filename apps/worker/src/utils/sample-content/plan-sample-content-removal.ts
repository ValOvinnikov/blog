import type { SanityDocument } from '@sanity/client';
import { STARTER_DOCUMENT_IDS } from '@shinefold/config';
import type { TLocaleIsoCode } from '@shinefold/config/constants';
import { hasArrayGotItems, isUndefined } from '@shinefold/utils/primitives';

import {
  listDocumentReferences,
  type TDocumentReference,
} from './document-references';
import { listEditedIds } from './edited-samples';
import { listKeptSamples, type TKeptSample } from './kept-samples';

export type TSampleContentSnapshot = {
  starterDocuments: SanityDocument[];
  pendingIds: string[];
  referrers: SanityDocument[];
  locale: TLocaleIsoCode;
};

type TSampleContentUnlink = {
  documentId: string;
  revision: string;
  field: string;
  keys: string[];
};

type TSampleContentRemoval = { documentId: string; revision: string };

export type TSampleContentRemovalPlan = {
  removals: TSampleContentRemoval[];
  unlinks: TSampleContentUnlink[];
  keptEdited: TKeptSample[];
  keptReferenced: TKeptSample[];
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
  locale,
}: TSampleContentSnapshot): TSampleContentRemovalPlan {
  const edited = listEditedIds(starterDocuments, pendingIds);
  const removable = new Set(
    starterDocuments.map(({ _id }) => _id).filter((id) => !edited.has(id)),
  );
  const documents = [...referrers, ...starterDocuments];
  const keptReferenced = new Set<string>();

  let blockedIds: string[];
  do {
    blockedIds = listOutsideReferences(documents, removable)
      .filter((outside) => !isUnlinkable(outside, removable))
      .map(({ reference }) => reference.targetId);
    for (const id of new Set(blockedIds)) {
      removable.delete(id);
      keptReferenced.add(id);
    }
  } while (hasArrayGotItems(blockedIds));

  return {
    removals: starterDocuments
      .filter(({ _id }) => removable.has(_id))
      .map(({ _id, _rev }) => ({ documentId: _id, revision: _rev }))
      .sort((a, b) => a.documentId.localeCompare(b.documentId)),
    unlinks: listUnlinks(listOutsideReferences(documents, removable)),
    keptEdited: listKeptSamples(starterDocuments, edited, locale),
    keptReferenced: listKeptSamples(starterDocuments, keptReferenced, locale),
  };
}
