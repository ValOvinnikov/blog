import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { MOCK_TAG_ID } from '@blog/service/testing/entities/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  evaluateRelatedPostsQuery,
  MOCK_DESIGN_NL_POST_ID,
  toIds,
} from '@blog/service/testing/shared/translated-posts-dataset';

import { relatedByTagsQuery } from './by-tags.query';

describe('relatedByTagsQuery', () => {
  describe('candidate selection', () => {
    function post(id: string, tagRefs: string[]) {
      return {
        _id: id,
        _type: 'page_post',
        publishedAt: '2020-01-01T00:00:00Z',
        tags: tagRefs.map((ref) => ({ _key: `${id}-${ref}`, _ref: ref })),
      };
    }
    const dataset = [
      post('anchor', ['tag-a', 'tag-b']),
      post('shares-a', ['tag-a', 'tag-z']),
      post('shares-b', ['tag-b']),
      post('shares-none', ['tag-z']),
      post('untagged', []),
      { ...post('future', ['tag-a']), publishedAt: '2999-01-01T00:00:00Z' },
    ];

    it('returns posts sharing a tag, excluding the anchor and posts sharing none', async () => {
      const raw = (await evaluateGroqExpression(
        relatedByTagsQuery.query,
        dataset,
        undefined,
        { currentId: 'anchor', tagIds: ['tag-a', 'tag-b'] },
      )) as { _id: string }[];

      expect(raw.map((candidate) => candidate._id).sort()).toEqual([
        'shares-a',
        'shares-b',
      ]);
    });
  });
});

describe('relatedByTagsQuery language scoping', () => {
  const { NL } = LOCALE_ISO_CODES;

  it('picks tag candidates only in the request language', async () => {
    expect(
      toIds(
        await evaluateRelatedPostsQuery(relatedByTagsQuery.query, {
          tagIds: [MOCK_TAG_ID],
          locale: NL,
        }),
      ),
    ).toEqual([MOCK_DESIGN_NL_POST_ID]);
  });
});
