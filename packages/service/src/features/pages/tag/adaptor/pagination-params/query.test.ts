import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { translatedPostDocuments } from '@blog/service/testing/shared/translated-posts-dataset';

import { tagPaginationParamsQuery } from './query';

const { EN, NL } = LOCALE_ISO_CODES;

describe('tagPaginationParamsQuery', () => {
  it('parses a tag page slug with its module ids and a post count', () => {
    const raw = [
      { slug: 'typescript', moduleRefs: [{ _ref: 'list-1' }], postCount: 5 },
    ];

    expect(() => tagPaginationParamsQuery.parse(raw)).not.toThrow();
  });

  it('parses a tag page with no modules and zero posts', () => {
    const raw = [{ slug: 'empty', moduleRefs: null, postCount: 0 }];

    expect(() => tagPaginationParamsQuery.parse(raw)).not.toThrow();
  });

  it('counts the published posts on the tag in the tag page language', async () => {
    const dataset = [
      ...translatedPostDocuments,
      {
        _id: 'page-en',
        _type: 'page_tag',
        tag: { _type: 'reference', _ref: 'tag-1' },
        slug: { current: 'design' },
        language: EN,
      },
      {
        _id: 'page-nl',
        _type: 'page_tag',
        tag: { _type: 'reference', _ref: 'tag-1' },
        slug: { current: 'ontwerp' },
        language: NL,
      },
    ];

    expect(
      await evaluateGroqExpression(
        tagPaginationParamsQuery.query,
        dataset,
        null,
        {
          locales: [EN, NL],
        },
      ),
    ).toMatchObject([
      { slug: 'design', language: EN, postCount: 3 },
      { slug: 'ontwerp', language: NL, postCount: 1 },
    ]);
  });
});
