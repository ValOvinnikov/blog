import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  MOCK_TOPIC_ID,
  MOCK_TOPIC_SLUG,
} from '@blog/service/testing/entities/fixtures';
import { mockListModuleRefs } from '@blog/service/testing/pages/fixtures';
import { mockReference } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { MOCK_TRANSLATED_POST_DOCUMENTS } from '@blog/service/testing/shared/translated-posts-dataset';

import { topicPaginationParamsQuery } from './query';

const { EN, NL } = LOCALE_ISO_CODES;

describe('topicPaginationParamsQuery', () => {
  it.each([
    [
      'slug with its module ids and a post count',
      [
        {
          slug: MOCK_TOPIC_SLUG,
          moduleRefs: mockListModuleRefs(),
          postCount: 5,
        },
      ],
    ],
    [
      'with no modules and zero posts',
      [{ slug: 'empty', moduleRefs: null, postCount: 0 }],
    ],
  ])('parses a topic page %s', (_, raw) => {
    expect(() => topicPaginationParamsQuery.parse(raw)).not.toThrow();
  });

  it('counts the published posts on the topic in the topic page language', async () => {
    const dataset = [
      ...MOCK_TRANSLATED_POST_DOCUMENTS,
      {
        _id: 'page-en',
        _type: 'page_topic',
        topic: mockReference(MOCK_TOPIC_ID),
        slug: { current: 'design' },
        language: EN,
      },
      {
        _id: 'page-nl',
        _type: 'page_topic',
        topic: mockReference(MOCK_TOPIC_ID),
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
