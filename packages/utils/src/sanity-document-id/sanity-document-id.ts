const DRAFT_ID_PREFIX = 'drafts.';

export function toDraftId(documentId: string): string {
  return documentId.startsWith(DRAFT_ID_PREFIX)
    ? documentId
    : `${DRAFT_ID_PREFIX}${documentId}`;
}

export function toPublishedId(documentId: string): string {
  return documentId.startsWith(DRAFT_ID_PREFIX)
    ? documentId.slice(DRAFT_ID_PREFIX.length)
    : documentId;
}
