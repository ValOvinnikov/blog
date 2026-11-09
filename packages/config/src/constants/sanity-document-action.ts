import type { TValueOf } from '@blog/config/utils';

export const SANITY_DOCUMENT_ACTION = {
  PUBLISH: 'publish',
  DISCARD_CHANGES: 'discardChanges',
  UNPUBLISH: 'unpublish',
  DUPLICATE: 'duplicate',
  DELETE: 'delete',
} as const;

export type TSanityDocumentAction = TValueOf<typeof SANITY_DOCUMENT_ACTION>;
