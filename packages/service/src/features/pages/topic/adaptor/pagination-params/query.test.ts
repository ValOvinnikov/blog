import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { translatedPostDocuments } from '@blog/service/testing/shared/translated-posts-dataset';

import { topicPaginationParamsQuery } from './query';

const { EN, NL } = LOCALE_ISO_CODES;

describe('topicPaginationParamsQuery', () => {
  it('parses a topic page slug with its module ids and a post count', () => {
    const raw = [
      { slug: 'engineering', moduleRefs: [{ _ref: 'list-1' }], postCount: 5 },
    ];

    expect(() => topicPaginationParamsQuery.parse(raw)).not.toThrow();
  });

  it('parses a topic page with no modules and zero posts', () => {
    const raw = [{ slug: 'empty', moduleRefs: null, postCount: 0 }];

    expect(() => topicPaginationParamsQuery.parse(raw)).not.toThrow();
  });

  it('counts the published posts on the topic in the topic page language', async () => {
    const dataset = [
      ...translatedPostDocuments,
      {
        _id: 'page-en',
        _type: 'page_topic',
        topic: { _type: 'reference', _ref: 'topic-1' },
        slug: { current: 'design' },
        language: EN,
      },
      {
        _id: 'page-nl',
        _type: 'page_topic',
        topic: { _type: 'reference', _ref: 'topic-1' },
        slug: { current: 'ontwerp' },
        language: NL,
      },
    ];

    expect(
      await evaluateGroqExpression(
        topicPaginationParamsQuery.query,
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
