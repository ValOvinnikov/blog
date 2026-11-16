import type {
  Page_legalDocument,
  Page_privacyDocument,
} from '@shinefold/config';

export type TSectionDocumentType =
  Page_privacyDocument['_type'] | Page_legalDocument['_type'];
