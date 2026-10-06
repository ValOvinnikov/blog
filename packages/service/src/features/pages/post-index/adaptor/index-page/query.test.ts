import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { makeRawBlogPage } from '@blog/service/testing/pages/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { blogPageQuery } from './query';

describe('blogPageQuery', () => {
  it('rejects a blog page with no headingBlock', () => {
    const raw = { ...makeRawBlogPage(), headingBlock: null };

    expect(() => blogPageQuery.parse(raw)).toThrow();
  });

  it('rejects a blog page with no authored SEO', () => {
    const raw = { ...makeRawBlogPage(), seo: null };

    expect(() => blogPageQuery.parse(raw)).toThrow();
  });

  it('parses a blog page with no modules set', () => {
    const raw = makeRawBlogPage({ modules: null });

    expect(() => blogPageQuery.parse(raw)).not.toThrow();
  });

  it('projects the headingBlock object, not the retired postList reference', () => {
    expect(blogPageQuery.query).toContain(
      '"headingBlock": headingBlock { heading, supportingText }',
    );
    expect(blogPageQuery.query).not.toContain('postList');
  });

  it('parses a blog page with its hero slot set', () => {
    const raw = makeRawBlogPage({
      hero: { _id: 'hero-1', _type: 'module_heroBlog' },
    });

    expect(() => blogPageQuery.parse(raw)).not.toThrow();
  });

  it('parses null as no matching page_postIndex document, rather than throwing', () => {
    expect(blogPageQuery.parse(null)).toBeNull();
  });
});

describe('blogPageQuery template layout', () => {
  const templateRef = { _type: 'reference', _ref: 'template-a' };
  const dataset = [
    {
      _id: 'template-a',
      _type: 'template_postIndex',
      hero: { _type: 'reference', _ref: 'hero-1' },
      modules: [{ _key: 'a', _type: 'reference', _ref: 'post-latest-1' }],
    },
    { _id: 'hero-1', _type: 'module_heroBlog' },
    { _id: 'post-latest-1', _type: 'module_postLatest' },
  ];

  function page(template?: typeof templateRef) {
    return {
      _id: 'page-a',
      _type: 'page_postIndex',
      ...(template ? { template } : {}),
    };
  }

  function run(data: unknown[]): Promise<unknown> {
    return evaluateGroqExpression(blogPageQuery.query, data, null, {});
  }

  it('resolves the hero and modules of the template the blog page references', async () => {
    expect(await run([page(templateRef), ...dataset])).toMatchObject({
      hero: { _id: 'hero-1', _type: 'module_heroBlog' },
      modules: [{ _id: 'post-latest-1', _type: 'module_postLatest' }],
    });
  });

  it('resolves no hero and no modules for a blog page without a template', async () => {
    expect(await run([page(), ...dataset])).toMatchObject({
      hero: null,
      modules: null,
    });
  });
});

describe('blogPageQuery language scoping', () => {
  const { EN, NL, FR } = LOCALE_ISO_CODES;

  function page(id: string, heading: string, language?: string) {
    return {
      _id: id,
      _type: 'page_postIndex',
      headingBlock: { heading },
      ...(language ? { language } : {}),
    };
  }

  function run(dataset: unknown[], locale: string): Promise<unknown> {
    return evaluateGroqExpression(blogPageQuery.query, dataset, null, {
      locale,
      defaultLocale: EN,
    });
  }

  const dataset = [
    page('page_postIndex', 'Blog', EN),
    page('page_postIndex-nl', 'Blog NL', NL),
  ];

  it("resolves each language's own blog page", async () => {
    expect(await run(dataset, EN)).toMatchObject({
      headingBlock: { heading: 'Blog' },
    });
    expect(await run(dataset, NL)).toMatchObject({
      headingBlock: { heading: 'Blog NL' },
    });
  });

  it('resolves nothing for a language without a blog page, rather than another language', async () => {
    expect(await run(dataset, FR)).toBeNull();
  });

  it('resolves a blog page with no language for the default language only', async () => {
    const legacy = [page('page_postIndex', 'Blog')];

    expect(await run(legacy, EN)).toMatchObject({
      headingBlock: { heading: 'Blog' },
    });
    expect(await run(legacy, NL)).toBeNull();
  });

  it('lists the language of every blog page as its translations', async () => {
    expect(await run(dataset, NL)).toMatchObject({
      translations: [{ language: EN }, { language: NL }],
    });
  });
});
