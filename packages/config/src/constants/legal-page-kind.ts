import { isOneOf } from '@blog/utils/primitives';

import type { TValueOf } from '@blog/config/utils';

export const LEGAL_PAGE_KIND = {
  PRIVACY_POLICY: 'PRIVACY_POLICY',
  TERMS: 'TERMS',
  IMPRINT: 'IMPRINT',
  COOKIE_STATEMENT: 'COOKIE_STATEMENT',
  OTHER: 'OTHER',
} as const;

export type TLegalPageKind = TValueOf<typeof LEGAL_PAGE_KIND>;

export const isLegalPageKind = (value: string): value is TLegalPageKind =>
  isOneOf(Object.values(LEGAL_PAGE_KIND), value);

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
