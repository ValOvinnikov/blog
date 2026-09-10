import { makeRawTopicIndexPage } from '@blog/service/testing/pages/fixtures';
import { makeRawOptionalHeadingBlock } from '@blog/service/testing/shared/fixtures';

import { topicIndexPageQuery } from './query';

describe('topicIndexPageQuery', () => {
  it('filters to page_topicIndex documents', () => {
    expect(topicIndexPageQuery.query).toContain('_type == "page_topicIndex"');
  });

  it('parses a topic index page with no headingBlock/hero/modules/SEO', () => {
    const raw = makeRawTopicIndexPage({
      headingBlock: null,
      hero: null,
      modules: null,
      seo: null,
    });

    expect(() => topicIndexPageQuery.parse(raw)).not.toThrow();
  });

  it('parses a topic index page with a taxonomy list module alongside other modules', () => {
    const raw = makeRawTopicIndexPage({
      modules: [
        { _id: 'taxonomy-list-1', _type: 'module_taxonomyList' },
        { _id: 'cta-1', _type: 'module_cta' },
      ],
    });

    expect(() => topicIndexPageQuery.parse(raw)).not.toThrow();
  });

  it('parses a topic index page with its hero slot set', () => {
    const raw = makeRawTopicIndexPage({
      hero: { _id: 'hero-1', _type: 'module_hero' },
    });

    expect(() => topicIndexPageQuery.parse(raw)).not.toThrow();
  });

  it('parses a topic index page with an authored headingBlock', () => {
    const raw = makeRawTopicIndexPage({
      headingBlock: makeRawOptionalHeadingBlock({
        heading: 'Browse by topic',
      }),
    });

    expect(() => topicIndexPageQuery.parse(raw)).not.toThrow();
  });

  it('parses null as no matching page_topicIndex document, rather than throwing', () => {
    expect(topicIndexPageQuery.parse(null)).toBeNull();
  });
});
