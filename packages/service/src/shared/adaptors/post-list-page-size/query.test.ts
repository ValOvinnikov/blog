import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { faker } from '@faker-js/faker';

import { postListPageSizeQuery } from './query';
import { toFirstPostListPageSize } from './transformer';

faker.seed(6019);

const MOCK_POST_LIST_A_ID = faker.string.uuid();
const MOCK_POST_LIST_B_ID = faker.string.uuid();
const MOCK_HERO_ID = faker.string.uuid();
const MOCK_POST_LIST_A_PAGE_SIZE = 7;
const MOCK_POST_LIST_B_PAGE_SIZE = 12;

const MOCK_DATASET = [
  {
    _id: MOCK_POST_LIST_A_ID,
    _type: 'module_postList',
    pageSize: MOCK_POST_LIST_A_PAGE_SIZE,
  },
  {
    _id: MOCK_POST_LIST_B_ID,
    _type: 'module_postList',
    pageSize: MOCK_POST_LIST_B_PAGE_SIZE,
  },
  { _id: MOCK_HERO_ID, _type: 'module_hero' },
];

async function pageSizeFor(moduleIds: string[]) {
  const raw = await evaluateGroqExpression(
    postListPageSizeQuery.query,
    MOCK_DATASET,
    null,
    { ids: moduleIds },
  );

  return toFirstPostListPageSize(moduleIds, postListPageSizeQuery.parse(raw));
}

describe('postListPageSizeQuery', () => {
  it.each([
    {
      when: 'the post list is first',
      moduleIds: [MOCK_POST_LIST_A_ID, MOCK_HERO_ID],
      expected: MOCK_POST_LIST_A_PAGE_SIZE,
    },
    {
      when: 'the post list is second',
      moduleIds: [MOCK_HERO_ID, MOCK_POST_LIST_A_ID],
      expected: MOCK_POST_LIST_A_PAGE_SIZE,
    },
    {
      when: 'two post lists are on the page',
      moduleIds: [MOCK_POST_LIST_B_ID, MOCK_POST_LIST_A_ID],
      expected: MOCK_POST_LIST_B_PAGE_SIZE,
    },
    {
      when: 'no module is a post list',
      moduleIds: [MOCK_HERO_ID],
      expected: null,
    },
    { when: 'the modules list is empty', moduleIds: [], expected: null },
  ])(
    "returns the first post list's page size when $when",
    async ({ moduleIds, expected }) => {
      const pageSize = await pageSizeFor(moduleIds);

      expect(pageSize).toBe(expected);
    },
  );
});
