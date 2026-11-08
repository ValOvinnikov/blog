import type { TValueOf } from '@blog/config/utils';

export const LEGAL_PAGE_KIND = {
  PRIVACY_POLICY: 'PRIVACY_POLICY',
  TERMS: 'TERMS',
  IMPRINT: 'IMPRINT',
  COOKIE_STATEMENT: 'COOKIE_STATEMENT',
  OTHER: 'OTHER',
} as const;

export type TLegalPageKind = TValueOf<typeof LEGAL_PAGE_KIND>;

export const PRIVACY_DOCUMENT_KINDS = [
  LEGAL_PAGE_KIND.PRIVACY_POLICY,
  LEGAL_PAGE_KIND.OTHER,
] as const satisfies readonly TLegalPageKind[];

export const LEGAL_DOCUMENT_KINDS = [
  LEGAL_PAGE_KIND.TERMS,
  LEGAL_PAGE_KIND.IMPRINT,
  LEGAL_PAGE_KIND.OTHER,
] as const satisfies readonly TLegalPageKind[];

export const COOKIE_STATEMENT_SLUG = 'cookie-statement';
