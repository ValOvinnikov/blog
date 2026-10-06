import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  toIds,
  translatedPostDocuments,
} from '@blog/service/testing/shared/translated-posts-dataset';

import {
  relatedByTagsQuery,
  relatedByTopicQuery,
  relatedPostAnchorQuery,
} from './posts.query';

describe('relatedPostAnchorQuery', () => {
  it('filters to page_post documents by id', () => {
    expect(relatedPostAnchorQuery.query).toContain('_type == "page_post"');
    expect(relatedPostAnchorQuery.query).toContain('_id == $postId');
  });

  it('parses null as no matching anchor post, rather than throwing', () => {
    expect(relatedPostAnchorQuery.parse(null)).toBeNull();
  });
});

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

describe('relatedByTopicQuery', () => {
  it('filters to page_post documents', () => {
    expect(relatedByTopicQuery(6).query).toContain('_type == "page_post"');
  });

  it('excludes posts whose publishedAt is in the future', () => {
    expect(relatedByTopicQuery(6).query).toContain('publishedAt <= now()');
  });

  it('bounds the candidate pool by the given limit', () => {
    expect(relatedByTopicQuery(6).query).toContain('[0...6]');
    expect(relatedByTopicQuery(12).query).toContain('[0...12]');
  });
});

describe('related posts language scoping', () => {
  const { EN, NL } = LOCALE_ISO_CODES;

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

  it('picks topic candidates only in the request language', async () => {
    expect(
      toIds(
        await run(relatedByTopicQuery(10).query, {
          topicId: 'topic-1',
          locale: EN,
        }),
      ),
    ).toEqual(['only-en', 'design-en']);
  });
});
