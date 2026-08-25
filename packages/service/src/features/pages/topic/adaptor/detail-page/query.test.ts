import { makeRawTopicPage } from '@blog/service/testing/pages/fixtures';

import { topicPageQuery } from './query';

describe('topicPageQuery', () => {
  it('filters to page_topic documents by their own slug', () => {
    expect(topicPageQuery.query).toContain('_type == "page_topic"');
    expect(topicPageQuery.query).toContain('slug.current == $slug');
  });

  it('parses a topic page with no postList slot set and no modules/SEO', () => {
    const raw = makeRawTopicPage({ postList: null, modules: null, seo: null });

    expect(() => topicPageQuery.parse(raw)).not.toThrow();
  });

  it('parses a topic page with a postList slot, modules, and SEO', () => {
    const raw = makeRawTopicPage({
      modules: [{ _id: 'cta-1', _type: 'module_cta' }],
      seo: { metaTitle: 'Engineering', metaDescription: null, openGraph: null },
    });

    expect(() => topicPageQuery.parse(raw)).not.toThrow();
  });

  it('parses null as no matching page_topic document, rather than throwing', () => {
    expect(topicPageQuery.parse(null)).toBeNull();
  });
});
