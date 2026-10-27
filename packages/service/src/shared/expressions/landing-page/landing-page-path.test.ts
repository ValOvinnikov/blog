import type { TMaybeNull } from '@blog/config';
import { mockReference } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { faker } from '@faker-js/faker';

import {
  LANDING_PAGE_PATH_EXPRESSION,
  PAGE_PATH_EXPRESSION,
} from './landing-page-path';

faker.seed(6021);

function mockLandingPage(slug: TMaybeNull<string>, parentId?: string) {
  return {
    _id: faker.string.uuid(),
    _type: 'page_landing',
    ...(slug ? { slug: { current: slug } } : {}),
    ...(parentId ? { parent: mockReference(parentId) } : {}),
  };
}

const MOCK_TOP = mockLandingPage(faker.lorem.slug(2));
const MOCK_CHILD = mockLandingPage(faker.lorem.slug(2), MOCK_TOP._id);
const MOCK_GRANDCHILD = mockLandingPage(faker.lorem.slug(2), MOCK_CHILD._id);
const MOCK_TOO_DEEP = mockLandingPage(faker.lorem.slug(2), MOCK_GRANDCHILD._id);
const MOCK_ORPHAN = mockLandingPage(faker.lorem.slug(2), faker.string.uuid());
const MOCK_SLUGLESS = mockLandingPage(null);
const MOCK_UNDER_SLUGLESS = mockLandingPage(
  faker.lorem.slug(2),
  MOCK_SLUGLESS._id,
);
const MOCK_POST_SLUG = faker.lorem.slug(2);
const MOCK_POST = {
  _id: faker.string.uuid(),
  _type: 'page_post',
  slug: { current: MOCK_POST_SLUG },
};

const MOCK_TOP_PATH = MOCK_TOP.slug?.current;
const MOCK_CHILD_PATH = `${MOCK_TOP_PATH}/${MOCK_CHILD.slug?.current}`;
const MOCK_GRANDCHILD_PATH = `${MOCK_CHILD_PATH}/${MOCK_GRANDCHILD.slug?.current}`;

const dataset = [
  MOCK_TOP,
  MOCK_CHILD,
  MOCK_GRANDCHILD,
  MOCK_TOO_DEEP,
  MOCK_ORPHAN,
  MOCK_SLUGLESS,
  MOCK_UNDER_SLUGLESS,
  MOCK_POST,
];

function resolvePath(id: string, expression: string): Promise<unknown> {
  return evaluateGroqExpression(
    `*[_id == $id][0]{ "path": ${expression} }.path`,
    dataset,
    null,
    { id },
  );
}

describe('LANDING_PAGE_PATH_EXPRESSION', () => {
  it.each([
    { page: 'a top-level page', id: MOCK_TOP._id, expected: MOCK_TOP_PATH },
    { page: 'a child page', id: MOCK_CHILD._id, expected: MOCK_CHILD_PATH },
    {
      page: 'a grandchild page',
      id: MOCK_GRANDCHILD._id,
      expected: MOCK_GRANDCHILD_PATH,
    },
  ])('resolves $page to its full path', async ({ id, expected }) => {
    const path = await resolvePath(id, LANDING_PAGE_PATH_EXPRESSION);

    expect(path).toBe(expected);
  });

  it.each([
    { page: 'a page nested deeper than three levels', id: MOCK_TOO_DEEP._id },
    { page: 'a page whose parent is deleted', id: MOCK_ORPHAN._id },
    { page: 'a page under a slugless parent', id: MOCK_UNDER_SLUGLESS._id },
  ])('resolves no path for $page', async ({ id }) => {
    const path = await resolvePath(id, LANDING_PAGE_PATH_EXPRESSION);

    expect(path).toBeNull();
  });
});

describe('PAGE_PATH_EXPRESSION', () => {
  it.each([
    {
      behaviour: 'resolves a landing page to its full path',
      id: MOCK_CHILD._id,
      expected: MOCK_CHILD_PATH,
    },
    {
      behaviour: 'resolves any other page to its slug',
      id: MOCK_POST._id,
      expected: MOCK_POST_SLUG,
    },
  ])('$behaviour', async ({ id, expected }) => {
    const path = await resolvePath(id, PAGE_PATH_EXPRESSION);

    expect(path).toBe(expected);
  });
});
