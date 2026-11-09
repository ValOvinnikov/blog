import type { LEGAL_PAGE_KIND, TLegalPageKind } from '@blog/config';

export type TSectionDocumentKind = Exclude<
  TLegalPageKind,
  typeof LEGAL_PAGE_KIND.OTHER
>;

export type TSectionDocumentLink = { href: string };
