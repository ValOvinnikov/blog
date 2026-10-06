import { RESERVED_SLUGS } from '@blog/config/constants';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import {
  LANDING_SLUG_SLASH_ERROR,
  landingSlugReservedError,
  validateLandingSlug,
} from '@blog/studio/schema-types/validation/validate-landing-slug/validate-landing-slug';
import type { SlugValue, ValidationContext } from 'sanity';

const [reserved] = RESERVED_SLUGS;

const slug = (current: string): SlugValue => ({ _type: 'slug', current });

const contextFor = (parent?: string) =>
  ({
    document: {
      _id: 'drafts.page',
      _type: PAGE_LANDING_TYPE,
      ...(parent ? { parent: { _type: 'reference', _ref: parent } } : {}),
    },
  }) as unknown as ValidationContext;

describe(validateLandingSlug, () => {
  it('passes an ordinary slug', () => {
    expect(validateLandingSlug(slug('about'), contextFor())).toBe(true);
  });

  it('rejects a slug containing a slash', () => {
    expect(validateLandingSlug(slug('help/faq'), contextFor())).toBe(
      LANDING_SLUG_SLASH_ERROR,
    );
  });

  it('rejects a reserved slug on a top-level page', () => {
    expect(validateLandingSlug(slug(reserved), contextFor())).toBe(
      landingSlugReservedError(reserved),
    );
  });

  it('accepts a reserved slug on a nested page', () => {
    expect(validateLandingSlug(slug(reserved), contextFor('help'))).toBe(true);
  });

  it('passes an empty slug', () => {
    expect(validateLandingSlug(undefined, contextFor())).toBe(true);
  });
});
