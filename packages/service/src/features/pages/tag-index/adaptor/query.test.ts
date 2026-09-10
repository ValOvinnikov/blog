import { makeRawTagIndexPage } from '@blog/service/testing/pages/fixtures';
import { makeRawOptionalHeadingBlock } from '@blog/service/testing/shared/fixtures';

import { tagIndexPageQuery } from './query';

describe('tagIndexPageQuery', () => {
  it('filters to page_tagIndex documents', () => {
    expect(tagIndexPageQuery.query).toContain('_type == "page_tagIndex"');
  });

  it('parses a tag index page with no headingBlock/hero/modules/SEO', () => {
    const raw = makeRawTagIndexPage({
      headingBlock: null,
      hero: null,
      modules: null,
      seo: null,
    });

    expect(() => tagIndexPageQuery.parse(raw)).not.toThrow();
  });

  it('parses a tag index page with a taxonomy list module alongside other modules', () => {
    const raw = makeRawTagIndexPage({
      modules: [
        { _id: 'taxonomy-list-1', _type: 'module_taxonomyList' },
        { _id: 'cta-1', _type: 'module_cta' },
      ],
    });

    expect(() => tagIndexPageQuery.parse(raw)).not.toThrow();
  });

  it('parses a tag index page with its hero slot set', () => {
    const raw = makeRawTagIndexPage({
      hero: { _id: 'hero-1', _type: 'module_hero' },
    });

    expect(() => tagIndexPageQuery.parse(raw)).not.toThrow();
  });

  it('parses a tag index page with an authored headingBlock', () => {
    const raw = makeRawTagIndexPage({
      headingBlock: makeRawOptionalHeadingBlock({
        heading: 'Browse by tag',
      }),
    });

    expect(() => tagIndexPageQuery.parse(raw)).not.toThrow();
  });

  it('parses null as no matching page_tagIndex document, rather than throwing', () => {
    expect(tagIndexPageQuery.parse(null)).toBeNull();
  });
});
