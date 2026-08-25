import { makeRawTopicIndexPage } from '@blog/service/testing/pages/fixtures';

import { topicIndexPageQuery } from './query';

describe('topicIndexPageQuery', () => {
  it('filters to page_topicIndex documents', () => {
    expect(topicIndexPageQuery.query).toContain('_type == "page_topicIndex"');
  });

  it('parses a topic index page with no supporting text and no SEO', () => {
    const raw = makeRawTopicIndexPage({ supportingText: null, seo: null });

    expect(() => topicIndexPageQuery.parse(raw)).not.toThrow();
  });

  it('parses a topic index page with no taxonomyList slot set', () => {
    const raw = makeRawTopicIndexPage({ taxonomyList: null });

    expect(() => topicIndexPageQuery.parse(raw)).not.toThrow();
  });

  it('parses null as no matching page_topicIndex document, rather than throwing', () => {
    expect(topicIndexPageQuery.parse(null)).toBeNull();
  });
});
