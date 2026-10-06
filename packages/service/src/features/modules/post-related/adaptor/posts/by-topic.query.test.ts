import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  toIds,
  translatedPostDocuments,
} from '@blog/service/testing/shared/translated-posts-dataset';

import { relatedByTopicQuery } from './by-topic.query';

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

describe('relatedByTopicQuery language scoping', () => {
  const { EN } = LOCALE_ISO_CODES;

  function run(query: string, params: Record<string, unknown>) {
    return evaluateGroqExpression(query, translatedPostDocuments, undefined, {
      currentId: 'notes-en',
      defaultLocale: EN,
      ...params,
    });
  }

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
