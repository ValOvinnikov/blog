import { RESERVED_SLUGS } from '@blog/config/constants';
import {
  LANDING_SLUG_SLASH_ERROR,
  landingSlugReservedError,
  validateLandingSlug,
} from '@blog/studio/schema-types/validation/validate-landing-slug/validate-landing-slug';
import { mockLandingPage } from '@blog/studio/testing/mock-documents';
import { faker } from '@faker-js/faker';
import type { SlugValue, ValidationContext } from 'sanity';

faker.seed(6028);

const [RESERVED_SLUG] = RESERVED_SLUGS;

const MOCK_SLUG = faker.lorem.slug(2);
const MOCK_SLASHED_SLUG = `${faker.lorem.slug(1)}/${faker.lorem.slug(1)}`;
const MOCK_PARENT_ID = faker.string.uuid();

const mockSlug = (current: string): SlugValue => ({ _type: 'slug', current });

const contextForPage = (parent?: string) =>
  ({
    document: mockLandingPage({ _id: faker.string.uuid(), parent }),
  }) as unknown as ValidationContext;

describe(validateLandingSlug, () => {
  it.each([
    ['passes an ordinary slug', mockSlug(MOCK_SLUG), undefined, true],
    ['passes an empty slug', undefined, undefined, true],
    [
      'rejects a slug containing a slash',
      mockSlug(MOCK_SLASHED_SLUG),
      undefined,
      LANDING_SLUG_SLASH_ERROR,
    ],
    [
      'rejects a reserved slug on a top-level page',
      mockSlug(RESERVED_SLUG),
      undefined,
      landingSlugReservedError(RESERVED_SLUG),
    ],
    [
      'accepts a reserved slug on a nested page',
      mockSlug(RESERVED_SLUG),
      MOCK_PARENT_ID,
      true,
    ],
  ])('%s', (_description, slug, parent, expected) => {
    expect(validateLandingSlug(slug, contextForPage(parent))).toBe(expected);
  });
});
