const DRAFT_ID_PREFIX = 'drafts.';
const VERSION_ID_PREFIX = 'versions.';

export function toDraftId(documentId: string): string {
  return documentId.startsWith(DRAFT_ID_PREFIX)
    ? documentId
    : `${DRAFT_ID_PREFIX}${documentId}`;
}

export function toPublishedId(documentId: string): string {
  if (documentId.startsWith(DRAFT_ID_PREFIX)) {
    return documentId.slice(DRAFT_ID_PREFIX.length);
  }
  if (documentId.startsWith(VERSION_ID_PREFIX)) {
    return documentId.split('.').slice(2).join('.');
  }
  return documentId;
}
