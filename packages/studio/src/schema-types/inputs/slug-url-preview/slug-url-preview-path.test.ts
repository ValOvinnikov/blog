import {
  buildNestedRoutePrefix,
  buildSlugUrlPreviewPath,
} from '@blog/studio/schema-types/inputs/slug-url-preview/slug-url-preview-path';
import { faker } from '@faker-js/faker';

faker.seed(4109);

const ROOT_PREFIX = '/';
const MOCK_SLUG = faker.lorem.slug();
const MOCK_PARENT_SLUG = faker.lorem.slug();
const MOCK_GRANDPARENT_SLUG = faker.lorem.slug();
const MOCK_ROUTE_PREFIX = `/${faker.lorem.word()}/`;

describe(buildSlugUrlPreviewPath, () => {
  it.each([
    {
      behaviour: 'joins a route prefix and a slug',
      prefix: MOCK_ROUTE_PREFIX,
      slug: MOCK_SLUG,
      expected: `${MOCK_ROUTE_PREFIX}${MOCK_SLUG}`,
    },
    {
      behaviour: 'joins the root prefix directly against the slug',
      prefix: ROOT_PREFIX,
      slug: MOCK_SLUG,
      expected: `/${MOCK_SLUG}`,
    },
    {
      behaviour: 'falls back to just the prefix when no slug is set yet',
      prefix: MOCK_ROUTE_PREFIX,
      slug: undefined,
      expected: MOCK_ROUTE_PREFIX,
    },
  ])('$behaviour', ({ prefix, slug, expected }) => {
    expect(buildSlugUrlPreviewPath(prefix, slug)).toBe(expected);
  });
});

describe(buildNestedRoutePrefix, () => {
  it('is the root for a top-level page', () => {
    expect(buildNestedRoutePrefix([])).toBe(ROOT_PREFIX);
  });

  it('joins ancestor slugs from the top of the tree down', () => {
    expect(
      buildNestedRoutePrefix([MOCK_PARENT_SLUG, MOCK_GRANDPARENT_SLUG]),
    ).toBe(`/${MOCK_GRANDPARENT_SLUG}/${MOCK_PARENT_SLUG}/`);
  });
});
