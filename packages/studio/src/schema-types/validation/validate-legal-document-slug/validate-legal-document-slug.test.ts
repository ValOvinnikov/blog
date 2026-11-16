import { faker } from '@faker-js/faker';
import { COOKIE_STATEMENT_SLUG } from '@shinefold/config/constants';
import {
  LEGAL_DOCUMENT_COOKIE_STATEMENT_SLUG_ERROR,
  validateLegalDocumentSlug,
} from '@shinefold/studio/schema-types/validation/validate-legal-document-slug/validate-legal-document-slug';
import type { SlugValue } from 'sanity';

faker.seed(6506);

const mockSlug = (current: string): SlugValue => ({ _type: 'slug', current });

describe(validateLegalDocumentSlug, () => {
  it('rejects the cookie statement slug', () => {
    expect(validateLegalDocumentSlug(mockSlug(COOKIE_STATEMENT_SLUG))).toBe(
      LEGAL_DOCUMENT_COOKIE_STATEMENT_SLUG_ERROR,
    );
  });

  it.each([
    ['an ordinary slug', mockSlug(faker.lorem.slug(2))],
    ['an empty slug', undefined],
  ])('passes %s', (_case, value) => {
    expect(validateLegalDocumentSlug(value)).toBe(true);
  });
});
