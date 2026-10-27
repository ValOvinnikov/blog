import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  MOCK_TAG_ID,
  MOCK_TOPIC_ID,
} from '@blog/service/testing/entities/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  MOCK_DESIGN_EN_POST_ID,
  MOCK_DESIGN_NL_POST_ID,
  MOCK_NOTES_EN_POST_ID,
  MOCK_ONLY_EN_POST_ID,
  MOCK_TRANSLATED_POST_DOCUMENTS,
  toIds,
} from '@blog/service/testing/shared/translated-posts-dataset';
import { faker } from '@faker-js/faker';

import { postListModulePaginatedPostsQuery } from './posts.query';

faker.seed(6014);

const { EN, NL } = LOCALE_ISO_CODES;

const MOCK_PUBLISHED_AT = '2020-01-01T00:00:00Z';
const MOCK_FUTURE_PUBLISHED_AT = '2999-01-01T00:00:00Z';
const MOCK_PAGE_SIZE = 2;
const MOCK_QUERY_PAGE_SIZE = 10;
const MOCK_TAG_ONLY_POST_ID = faker.string.uuid();
const MOCK_TAG_AND_TOPIC_POST_ID = faker.string.uuid();
const MOCK_TOPIC_ONLY_POST_ID = faker.string.uuid();
const MOCK_OTHER_TAG_POST_ID = faker.string.uuid();
const MOCK_FUTURE_POST_ID = faker.string.uuid();
const MOCK_OTHER_TAG_ID = faker.string.uuid();
const MOCK_PAGED_POST_IDS = Array.from({ length: 5 }, () =>
  faker.string.uuid(),
);

function mockPost(
  id: string,
  refs: { tag?: string; topic?: string } = {},
  publishedAt = MOCK_PUBLISHED_AT,
) {
  return {
    _id: id,
    _type: 'page_post',
    publishedAt,
    tags: refs.tag ? [{ _key: id, _ref: refs.tag }] : [],
    topic: refs.topic ? { _ref: refs.topic } : undefined,
  };
}

const MOCK_SCOPING_DATASET = [
  mockPost(MOCK_TAG_ONLY_POST_ID, { tag: MOCK_TAG_ID }),
  mockPost(MOCK_TAG_AND_TOPIC_POST_ID, {
    tag: MOCK_TAG_ID,
    topic: MOCK_TOPIC_ID,
  }),
  mockPost(MOCK_TOPIC_ONLY_POST_ID, { topic: MOCK_TOPIC_ID }),
  mockPost(MOCK_OTHER_TAG_POST_ID, { tag: MOCK_OTHER_TAG_ID }),
  mockPost(MOCK_FUTURE_POST_ID, { tag: MOCK_TAG_ID }, MOCK_FUTURE_PUBLISHED_AT),
];

const MOCK_PAGED_DATASET = MOCK_PAGED_POST_IDS.map((id, index) =>
  mockPost(id, {}, `2026-01-0${MOCK_PAGED_POST_IDS.length - index}T00:00:00Z`),
);

type TPostsPage = { posts: { _id: string }[]; total: number };

describe(postListModulePaginatedPostsQuery, () => {
  it.each([
    [1, MOCK_PAGED_POST_IDS.slice(0, 2)],
    [2, MOCK_PAGED_POST_IDS.slice(2, 4)],
    [3, MOCK_PAGED_POST_IDS.slice(4)],
  ])('returns the newest-first posts of page %i', async (page, expected) => {
    const result = (await evaluateGroqExpression(
      postListModulePaginatedPostsQuery(page, MOCK_PAGE_SIZE).query,
      MOCK_PAGED_DATASET,
      undefined,
      {},
    )) as TPostsPage;

    expect(result.posts.map(({ _id }) => _id)).toEqual(expected);
    expect(result.total).toBe(MOCK_PAGED_POST_IDS.length);
  });

  describe('scoping', () => {
    async function run(termId?: string) {
      const query = postListModulePaginatedPostsQuery(
        1,
        MOCK_QUERY_PAGE_SIZE,
        termId ? { termId } : undefined,
      ).query;

      return (await evaluateGroqExpression(
        query,
        MOCK_SCOPING_DATASET,
        undefined,
        termId ? { termId } : {},
      )) as TPostsPage;
    }

    it.each([
      [
        'a tag',
        MOCK_TAG_ID,
        [MOCK_TAG_ONLY_POST_ID, MOCK_TAG_AND_TOPIC_POST_ID],
      ],
      [
        'a topic',
        MOCK_TOPIC_ID,
        [MOCK_TAG_AND_TOPIC_POST_ID, MOCK_TOPIC_ONLY_POST_ID],
      ],
    ])(
      'returns and counts only published posts referencing %s',
      async (_, termId, expected) => {
        const result = await run(termId);

        expect(result.posts.map(({ _id }) => _id).sort()).toEqual(
          [...expected].sort(),
        );
        expect(result.total).toBe(expected.length);
      },
    );

    it('returns every published post when unscoped', async () => {
      const expected = [
        MOCK_TAG_ONLY_POST_ID,
        MOCK_TAG_AND_TOPIC_POST_ID,
        MOCK_TOPIC_ONLY_POST_ID,
        MOCK_OTHER_TAG_POST_ID,
      ];

      const result = await run();

      expect(result.posts.map(({ _id }) => _id).sort()).toEqual(
        [...expected].sort(),
      );
      expect(result.total).toBe(expected.length);
    });
  });

  describe('language scoping', () => {
    async function run(locale: string, termId?: string) {
      const result = (await evaluateGroqExpression(
        postListModulePaginatedPostsQuery(
          1,
          MOCK_QUERY_PAGE_SIZE,
          termId ? { termId } : undefined,
        ).query,
        MOCK_TRANSLATED_POST_DOCUMENTS,
        undefined,
        { locale, defaultLocale: EN, ...(termId ? { termId } : {}) },
      )) as { posts: unknown; total: number };

      return { ids: toIds(result.posts), total: result.total };
    }

    it.each([
      [NL, [MOCK_DESIGN_NL_POST_ID]],
      [
        EN,
        [MOCK_ONLY_EN_POST_ID, MOCK_DESIGN_EN_POST_ID, MOCK_NOTES_EN_POST_ID],
      ],
    ])(
      'lists and counts only published %s posts in the request language',
      async (locale, expected) => {
        const result = await run(locale);

        expect(result).toEqual({ ids: expected, total: expected.length });
      },
    );

    it('keeps the language scope on a topic-scoped list', async () => {
      const result = await run(NL, MOCK_TOPIC_ID);

      expect(result).toEqual({ ids: [MOCK_DESIGN_NL_POST_ID], total: 1 });
    });
  });
});
