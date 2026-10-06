import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { makeRawTopicIndexPage } from '@blog/service/testing/pages/fixtures';
import { makeRawHeadingBlock } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { topicIndexPageQuery } from './query';

describe('topicIndexPageQuery', () => {
  it('filters to page_topicIndex documents', () => {
    expect(topicIndexPageQuery.query).toContain('_type == "page_topicIndex"');
  });

  it('parses a topic index page with no hero/modules', () => {
    const raw = makeRawTopicIndexPage({
      hero: null,
      modules: null,
    });

    expect(() => topicIndexPageQuery.parse(raw)).not.toThrow();
  });

  it('rejects a topic index page with no headingBlock', () => {
    const raw = { ...makeRawTopicIndexPage(), headingBlock: null };

    expect(() => topicIndexPageQuery.parse(raw)).toThrow();
  });

  it('rejects a topic index page with no authored SEO', () => {
    const raw = { ...makeRawTopicIndexPage(), seo: null };

    expect(() => topicIndexPageQuery.parse(raw)).toThrow();
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
      hero: { _id: 'hero-1', _type: 'module_heroBlog' },
    });

    expect(() => topicIndexPageQuery.parse(raw)).not.toThrow();
  });

  it('parses a topic index page with an authored headingBlock', () => {
    const raw = makeRawTopicIndexPage({
      headingBlock: makeRawHeadingBlock('Browse by topic'),
    });

    expect(() => topicIndexPageQuery.parse(raw)).not.toThrow();
  });

  it('parses null as no matching page_topicIndex document, rather than throwing', () => {
    expect(topicIndexPageQuery.parse(null)).toBeNull();
  });
});

describe('topicIndexPageQuery template layout', () => {
  const templateRef = { _type: 'reference', _ref: 'template-a' };
  const dataset = [
    {
      _id: 'template-a',
      _type: 'template_topicIndex',
      hero: { _type: 'reference', _ref: 'hero-1' },
      modules: [{ _key: 'a', _type: 'reference', _ref: 'post-latest-1' }],
    },
    { _id: 'hero-1', _type: 'module_heroBlog' },
    { _id: 'post-latest-1', _type: 'module_postLatest' },
  ];

  function page(template?: typeof templateRef) {
    return {
      _id: 'page-a',
      _type: 'page_topicIndex',
      ...(template ? { template } : {}),
    };
  }

  function run(data: unknown[]): Promise<unknown> {
    return evaluateGroqExpression(topicIndexPageQuery.query, data, null, {});
  }

  it('resolves the hero and modules of the template the topic index page references', async () => {
    expect(await run([page(templateRef), ...dataset])).toMatchObject({
      hero: { _id: 'hero-1', _type: 'module_heroBlog' },
      modules: [{ _id: 'post-latest-1', _type: 'module_postLatest' }],
    });
  });

  it('resolves no hero and no modules for a topic index page without a template', async () => {
    expect(await run([page(), ...dataset])).toMatchObject({
      hero: null,
      modules: null,
    });
  });
});

describe('topicIndexPageQuery language scoping', () => {
  const { EN, NL, FR } = LOCALE_ISO_CODES;

  function page(id: string, heading: string, language?: string) {
    return {
      _id: id,
      _type: 'page_topicIndex',
      headingBlock: { heading },
      ...(language ? { language } : {}),
    };
  }

  function run(dataset: unknown[], locale: string): Promise<unknown> {
    return evaluateGroqExpression(topicIndexPageQuery.query, dataset, null, {
      locale,
      defaultLocale: EN,
    });
  }

  const dataset = [
    page('page_topicIndex', 'Topics', EN),
    page('page_topicIndex-nl', 'Onderwerpen', NL),
  ];

  it("resolves each language's own topic index page", async () => {
    expect(await run(dataset, EN)).toMatchObject({
      headingBlock: { heading: 'Topics' },
    });
    expect(await run(dataset, NL)).toMatchObject({
      headingBlock: { heading: 'Onderwerpen' },
    });
  });

  it('resolves nothing for a language without a topic index page, rather than another language', async () => {
    expect(await run(dataset, FR)).toBeNull();
  });

  it('resolves a topic index page with no language for the default language only', async () => {
    const legacy = [page('page_topicIndex', 'Topics')];

    expect(await run(legacy, EN)).toMatchObject({
      headingBlock: { heading: 'Topics' },
    });
    expect(await run(legacy, NL)).toBeNull();
  });

  it('lists the language of every topic index page as its translations', async () => {
    expect(await run(dataset, NL)).toMatchObject({
      translations: [{ language: EN }, { language: NL }],
    });
  });
});
