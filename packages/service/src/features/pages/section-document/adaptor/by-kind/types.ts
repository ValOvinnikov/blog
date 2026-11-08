import type {
  LEGAL_PAGE_KIND,
  Page_legalDocument,
  Page_privacyDocument,
} from '@blog/config';

export type TSectionDocumentKind = Exclude<
  NonNullable<(Page_privacyDocument | Page_legalDocument)['kind']>,
  typeof LEGAL_PAGE_KIND.OTHER
>;

export type TSectionDocumentLink = { href: string };
