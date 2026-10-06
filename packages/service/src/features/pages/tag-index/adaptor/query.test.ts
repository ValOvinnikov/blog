import { makeRawTagIndexPage } from '@blog/service/testing/pages/fixtures';
import { makeRawHeadingBlock } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { tagIndexPageQuery } from './query';

describe('tagIndexPageQuery', () => {
  it('filters to page_tagIndex documents', () => {
    expect(tagIndexPageQuery.query).toContain('_type == "page_tagIndex"');
  });

  it('parses a tag index page with no hero/modules', () => {
    const raw = makeRawTagIndexPage({
      hero: null,
      modules: null,
    });

    expect(() => tagIndexPageQuery.parse(raw)).not.toThrow();
  });

  it('rejects a tag index page with no headingBlock', () => {
    const raw = { ...makeRawTagIndexPage(), headingBlock: null };

    expect(() => tagIndexPageQuery.parse(raw)).toThrow();
  });

  it('rejects a tag index page with no authored SEO', () => {
    const raw = { ...makeRawTagIndexPage(), seo: null };

    expect(() => tagIndexPageQuery.parse(raw)).toThrow();
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
      hero: { _id: 'hero-1', _type: 'module_heroBlog' },
    });

    expect(() => tagIndexPageQuery.parse(raw)).not.toThrow();
  });

  it('parses a tag index page with an authored headingBlock', () => {
    const raw = makeRawTagIndexPage({
      headingBlock: makeRawHeadingBlock('Browse by tag'),
    });

    expect(() => tagIndexPageQuery.parse(raw)).not.toThrow();
  });

  it('parses null as no matching page_tagIndex document, rather than throwing', () => {
    expect(tagIndexPageQuery.parse(null)).toBeNull();
  });
});

describe('tagIndexPageQuery template layout', () => {
  const templateRef = { _type: 'reference', _ref: 'template-a' };
  const dataset = [
    {
      _id: 'template-a',
      _type: 'template_tagIndex',
      hero: { _type: 'reference', _ref: 'hero-1' },
      modules: [{ _key: 'a', _type: 'reference', _ref: 'post-latest-1' }],
    },
    { _id: 'hero-1', _type: 'module_heroBlog' },
    { _id: 'post-latest-1', _type: 'module_postLatest' },
  ];

  function page(template?: typeof templateRef) {
    return {
      _id: 'page-a',
      _type: 'page_tagIndex',
      ...(template ? { template } : {}),
    };
  }

  function run(data: unknown[]): Promise<unknown> {
    return evaluateGroqExpression(tagIndexPageQuery.query, data, null, {});
  }

  it('resolves the hero and modules of the template the tag index page references', async () => {
    expect(await run([page(templateRef), ...dataset])).toMatchObject({
      hero: { _id: 'hero-1', _type: 'module_heroBlog' },
      modules: [{ _id: 'post-latest-1', _type: 'module_postLatest' }],
    });
  });

  it('resolves no hero and no modules for a tag index page without a template', async () => {
    expect(await run([page(), ...dataset])).toMatchObject({
      hero: null,
      modules: null,
    });
  });
});
