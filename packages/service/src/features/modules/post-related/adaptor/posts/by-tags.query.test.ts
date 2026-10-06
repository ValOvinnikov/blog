import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  toIds,
  translatedPostDocuments,
} from '@blog/service/testing/shared/translated-posts-dataset';

import { relatedByTagsQuery } from './by-tags.query';

describe('relatedByTagsQuery', () => {
  it('filters to page_post documents', () => {
    expect(relatedByTagsQuery.query).toContain('_type == "page_post"');
  });

  it('excludes posts whose publishedAt is in the future', () => {
    expect(relatedByTagsQuery.query).toContain('publishedAt <= now()');
  });

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
  const { NL, EN } = LOCALE_ISO_CODES;

  function run(query: string, params: Record<string, unknown>) {
    return evaluateGroqExpression(query, translatedPostDocuments, undefined, {
      currentId: 'notes-en',
      defaultLocale: EN,
      ...params,
    });
  }

  it('picks tag candidates only in the request language', async () => {
    expect(
      toIds(
        await run(relatedByTagsQuery.query, { tagIds: ['tag-1'], locale: NL }),
      ),
    ).toEqual(['design-nl']);
  });
});
