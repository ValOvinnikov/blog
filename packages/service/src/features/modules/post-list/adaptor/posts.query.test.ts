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

import { postListModulePaginatedPostsQuery } from './posts.query';

describe(postListModulePaginatedPostsQuery, () => {
  it.each([
    [1, '[0...9]'],
    [2, '[9...18]'],
    [3, '[18...27]'],
  ])('windows page %i by pageSize as an end-exclusive slice', (page, slice) => {
    expect(postListModulePaginatedPostsQuery(page, 9).query).toContain(slice);
  });

  describe('scoping', () => {
    function post(id: string, refs: { tag?: string; topic?: string }) {
      return {
        _id: id,
        _type: 'page_post',
        publishedAt: '2020-01-01T00:00:00Z',
        tags: refs.tag ? [{ _key: id, _ref: refs.tag }] : [],
        topic: refs.topic ? { _ref: refs.topic } : undefined,
      };
    }
    const dataset = [
      post('a', { tag: MOCK_TAG_ID }),
      post('b', { tag: MOCK_TAG_ID, topic: MOCK_TOPIC_ID }),
      post('c', { topic: MOCK_TOPIC_ID }),
      post('d', { tag: 'tag-2' }),
      {
        ...post('future', { tag: MOCK_TAG_ID }),
        publishedAt: '2999-01-01T00:00:00Z',
      },
    ];

    async function run(termId?: string) {
      const query = postListModulePaginatedPostsQuery(
        1,
        10,
        termId ? { termId } : undefined,
      ).query;

      return (await evaluateGroqExpression(
        query,
        dataset,
        undefined,
        termId ? { termId } : {},
      )) as { posts: { _id: string }[]; total: number };
    }

    it.each([
      ['a tag', MOCK_TAG_ID, ['a', 'b']],
      ['a topic', MOCK_TOPIC_ID, ['b', 'c']],
    ])(
      'returns and counts only published posts referencing %s',
      async (_, termId, expected) => {
        const result = await run(termId);

        expect(result.posts.map((p) => p._id).sort()).toEqual(expected);
        expect(result.total).toBe(2);
      },
    );

    it('returns every published post when unscoped', async () => {
      const result = await run();

      expect(result.posts.map((p) => p._id).sort()).toEqual([
        'a',
        'b',
        'c',
        'd',
      ]);
      expect(result.total).toBe(4);
    });
  });
});

describe('postListModulePaginatedPostsQuery language scoping', () => {
  const { EN, NL } = LOCALE_ISO_CODES;

  async function run(locale: string, termId?: string) {
    const result = (await evaluateGroqExpression(
      postListModulePaginatedPostsQuery(1, 10, termId ? { termId } : undefined)
        .query,
      MOCK_TRANSLATED_POST_DOCUMENTS,
      undefined,
      { locale, defaultLocale: EN, ...(termId ? { termId } : {}) },
    )) as { posts: unknown; total: number };

    return { ids: toIds(result.posts), total: result.total };
  }

  it('lists and counts only published posts in the request language', async () => {
    expect(await run(NL)).toEqual({ ids: [MOCK_DESIGN_NL_POST_ID], total: 1 });
    expect(await run(EN)).toEqual({
      ids: [
        MOCK_ONLY_EN_POST_ID,
        MOCK_DESIGN_EN_POST_ID,
        MOCK_NOTES_EN_POST_ID,
      ],
      total: 3,
    });
  });

  it('keeps the language scope on a topic-scoped list', async () => {
    expect(await run(NL, MOCK_TOPIC_ID)).toEqual({
      ids: [MOCK_DESIGN_NL_POST_ID],
      total: 1,
    });
  });
});
