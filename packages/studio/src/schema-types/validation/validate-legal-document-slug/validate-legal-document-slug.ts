import { COOKIE_STATEMENT_SLUG } from '@blog/config/constants';
import type { SlugValue } from 'sanity';

export const LEGAL_DOCUMENT_COOKIE_STATEMENT_SLUG_ERROR = `"${COOKIE_STATEMENT_SLUG}" is the cookie statement's own address and can't be used by another legal page.`;

export const validateLegalDocumentSlug = (
  value: SlugValue | undefined,
): string | true =>
  value?.current === COOKIE_STATEMENT_SLUG
    ? LEGAL_DOCUMENT_COOKIE_STATEMENT_SLUG_ERROR
    : true;
