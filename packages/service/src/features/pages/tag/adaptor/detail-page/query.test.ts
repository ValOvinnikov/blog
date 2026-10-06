import { makeRawTagPage } from '@blog/service/testing/pages/fixtures';
import { makeRawHeadingBlock } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { tagPageQuery } from './query';

describe('tagPageQuery', () => {
  it('filters to page_tag documents by their own slug', () => {
    expect(tagPageQuery.query).toContain('_type == "page_tag"');
    expect(tagPageQuery.query).toContain('slug.current == $slug');
  });

  it('parses a tag page with no modules', () => {
    const raw = makeRawTagPage({ modules: null });

    expect(() => tagPageQuery.parse(raw)).not.toThrow();
  });

  it('rejects a tag page with no authored SEO', () => {
    const raw = { ...makeRawTagPage(), seo: null };

    expect(() => tagPageQuery.parse(raw)).toThrow();
  });

  it('parses a tag page with a list module alongside other modules, and SEO', () => {
    const raw = makeRawTagPage({
      modules: [
        { _id: 'post-list-1', _type: 'module_postList' },
        { _id: 'cta-1', _type: 'module_cta' },
      ],
      seo: { metaTitle: 'TypeScript', metaDescription: null, openGraph: null },
    });

    expect(() => tagPageQuery.parse(raw)).not.toThrow();
  });

  it('parses a tag page with its hero slot set', () => {
    const raw = makeRawTagPage({
      hero: { _id: 'hero-1', _type: 'module_heroBlog' },
    });

    expect(() => tagPageQuery.parse(raw)).not.toThrow();
  });

  it('parses a tag page with an authored headingBlock', () => {
    const raw = makeRawTagPage({
      headingBlock: makeRawHeadingBlock('TypeScript'),
    });

    expect(() => tagPageQuery.parse(raw)).not.toThrow();
  });

  it('rejects a tag page with no headingBlock', () => {
    const raw = { ...makeRawTagPage(), headingBlock: null };

    expect(() => tagPageQuery.parse(raw)).toThrow();
  });

  it('parses null as no matching page_tag document, rather than throwing', () => {
    expect(tagPageQuery.parse(null)).toBeNull();
  });
});

describe('tagPageQuery template layout', () => {
  const templateRef = { _type: 'reference', _ref: 'template-a' };
  const dataset = [
    {
      _id: 'template-a',
      _type: 'template_tag',
      hero: { _type: 'reference', _ref: 'hero-1' },
      modules: [{ _key: 'a', _type: 'reference', _ref: 'post-latest-1' }],
    },
    { _id: 'hero-1', _type: 'module_heroBlog' },
    { _id: 'post-latest-1', _type: 'module_postLatest' },
  ];

  function page(template?: typeof templateRef) {
    return {
      _id: 'page-a',
      _type: 'page_tag',
      slug: { current: 'engineering' },
      ...(template ? { template } : {}),
    };
  }

  function run(data: unknown[]): Promise<unknown> {
    return evaluateGroqExpression(tagPageQuery.query, data, null, {
      slug: 'engineering',
    });
  }

  it('resolves the hero and modules of the template the tag page references', async () => {
    expect(await run([page(templateRef), ...dataset])).toMatchObject({
      hero: { _id: 'hero-1', _type: 'module_heroBlog' },
      modules: [{ _id: 'post-latest-1', _type: 'module_postLatest' }],
    });
  });

  it('resolves no hero and no modules for a tag page without a template', async () => {
    expect(await run([page(), ...dataset])).toMatchObject({
      hero: null,
      modules: null,
    });
  });
});
