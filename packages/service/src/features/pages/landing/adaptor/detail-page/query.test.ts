import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { makeRawLandingPage } from '@blog/service/testing/pages/fixtures';
import { makeRawHeadingBlock } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { landingPageQuery } from './query';

describe('landingPageQuery', () => {
  it('parses a landing page with no modules', () => {
    const raw = makeRawLandingPage({ modules: null });

    expect(() => landingPageQuery.parse(raw)).not.toThrow();
  });

  it('rejects a landing page with no authored SEO', () => {
    const raw = { ...makeRawLandingPage(), seo: null };

    expect(() => landingPageQuery.parse(raw)).toThrow();
  });

  it('parses a landing page with its hero slot set', () => {
    const raw = makeRawLandingPage({
      hero: { _id: 'hero-1', _type: 'module_heroBlog' },
    });

    expect(() => landingPageQuery.parse(raw)).not.toThrow();
  });

  it('rejects a landing page with no headingBlock', () => {
    const raw = { ...makeRawLandingPage(), headingBlock: null };

    expect(() => landingPageQuery.parse(raw)).toThrow();
  });

  it('parses a landing page with a headingBlock heading and supportingText', () => {
    const raw = makeRawLandingPage({
      headingBlock: makeRawHeadingBlock('About Us', {
        supportingText: 'Who we are',
      }),
    });

    expect(() => landingPageQuery.parse(raw)).not.toThrow();
  });

  it('parses null as no matching page_landing document, rather than throwing', () => {
    expect(landingPageQuery.parse(null)).toBeNull();
  });
});

describe('landingPageQuery language scoping', () => {
  const { EN, NL, FR } = LOCALE_ISO_CODES;

  function landing(
    id: string,
    slug: string,
    heading: string,
    language?: string,
  ) {
    return {
      _id: id,
      _type: 'page_landing',
      slug: { current: slug },
      headingBlock: { heading },
      ...(language ? { language } : {}),
    };
  }

  function link(language: string, id: string) {
    return {
      _key: language,
      language,
      value: { _type: 'reference', _ref: id },
    };
  }

  const dataset = [
    landing('about-en', 'about', 'About', EN),
    landing('about-nl', 'about', 'Over ons', NL),
    landing('legacy', 'legacy', 'Legacy'),
    {
      _id: 'meta-about',
      _type: 'translation.metadata',
      translations: [link(EN, 'about-en'), link(NL, 'about-nl')],
    },
  ];

  function run(slug: string, locale: string): Promise<unknown> {
    return evaluateGroqExpression(landingPageQuery.query, dataset, null, {
      slug,
      path: slug,
      locale,
      defaultLocale: EN,
    });
  }

  it('resolves the same slug to a different page per language', async () => {
    expect(await run('about', EN)).toMatchObject({
      headingBlock: { heading: 'About' },
    });
    expect(await run('about', NL)).toMatchObject({
      headingBlock: { heading: 'Over ons' },
    });
  });

  it('resolves nothing for a language the page is not authored in', async () => {
    expect(await run('about', FR)).toBeNull();
  });

  it('resolves nothing for a page with no language', async () => {
    expect(await run('legacy', EN)).toBeNull();
    expect(await run('legacy', NL)).toBeNull();
  });

  it('returns the linked translations with their languages and slugs', async () => {
    expect(await run('about', NL)).toMatchObject({
      translations: [
        { language: EN, slug: 'about' },
        { language: NL, slug: 'about' },
      ],
    });
  });
});

describe('landingPageQuery template layout', () => {
  const { EN, NL } = LOCALE_ISO_CODES;

  function landing(id: string, language: string, template?: string) {
    return {
      _id: id,
      _type: 'page_landing',
      slug: { current: 'about' },
      language,
      headingBlock: { heading: id },
      ...(template ? { template: { _type: 'reference', _ref: template } } : {}),
    };
  }

  const dataset = [
    landing('about-en', EN, 'template-about'),
    landing('about-nl', NL, 'template-about'),
    {
      _id: 'template-about',
      _type: 'template_landing',
      hero: { _type: 'reference', _ref: 'hero-1' },
      modules: [
        { _key: 'a', _type: 'reference', _ref: 'content-1' },
        { _key: 'b', _type: 'reference', _ref: 'cta-1' },
      ],
    },
    { _id: 'hero-1', _type: 'module_heroStatement' },
    { _id: 'content-1', _type: 'module_content' },
    { _id: 'cta-1', _type: 'module_cta' },
  ];

  function run(data: unknown[], locale: string): Promise<unknown> {
    return evaluateGroqExpression(landingPageQuery.query, data, null, {
      slug: 'about',
      path: 'about',
      locale,
      defaultLocale: EN,
    });
  }

  it.each([EN, NL])(
    'resolves the hero and modules of the template the %s page references',
    async (locale) => {
      expect(await run(dataset, locale)).toMatchObject({
        hero: { _id: 'hero-1', _type: 'module_heroStatement' },
        modules: [
          { _id: 'content-1', _type: 'module_content' },
          { _id: 'cta-1', _type: 'module_cta' },
        ],
      });
    },
  );

  it('resolves no hero and no modules for a page without a template', async () => {
    expect(await run([landing('about-en', EN)], EN)).toMatchObject({
      hero: null,
      modules: null,
    });
  });
});

describe('landingPageQuery nested paths', () => {
  const { EN } = LOCALE_ISO_CODES;

  function landing(id: string, slug: string, parent?: string) {
    return {
      _id: id,
      _type: 'page_landing',
      slug: { current: slug },
      language: EN,
      headingBlock: { heading: id },
      ...(parent ? { parent: { _type: 'reference', _ref: parent } } : {}),
    };
  }

  const dataset = [
    landing('modules', 'modules'),
    landing('faq', 'faq', 'modules'),
    landing('pricing', 'pricing'),
  ];

  function run(segments: string[]): Promise<unknown> {
    return evaluateGroqExpression(landingPageQuery.query, dataset, null, {
      slug: segments.at(-1),
      path: segments.join('/'),
      locale: EN,
      defaultLocale: EN,
    });
  }

  it('resolves a nested page at its full path', async () => {
    expect(await run(['modules', 'faq'])).toMatchObject({
      _id: 'faq',
      path: 'modules/faq',
      headingBlock: { heading: 'faq' },
    });
  });

  it('resolves nothing for a nested page at its bare slug', async () => {
    expect(await run(['faq'])).toBeNull();
  });

  it('resolves nothing for a top-level page under a parent it does not have', async () => {
    expect(await run(['modules', 'pricing'])).toBeNull();
  });

  it('resolves a top-level page at its slug', async () => {
    expect(await run(['pricing'])).toMatchObject({ path: 'pricing' });
  });
});

describe('landingPageQuery section chain', () => {
  const { EN, NL } = LOCALE_ISO_CODES;

  function landing(
    id: string,
    {
      parent,
      orderRank,
      sectionNavigation,
      language = EN,
    }: {
      parent?: string;
      orderRank?: string;
      sectionNavigation?: boolean;
      language?: string;
    } = {},
  ) {
    return {
      _id: id,
      _type: 'page_landing',
      slug: { current: id },
      language,
      headingBlock: { heading: `${id} heading` },
      ...(orderRank ? { orderRank } : {}),
      ...(sectionNavigation === undefined ? {} : { sectionNavigation }),
      ...(parent ? { parent: { _type: 'reference', _ref: parent } } : {}),
    };
  }

  const dataset = [
    landing('modules', { sectionNavigation: true }),
    landing('pricing', { parent: 'modules', orderRank: '0|b' }),
    landing('faq', { parent: 'modules', orderRank: '0|a' }),
    landing('prijzen', { parent: 'modules', orderRank: '0|0', language: NL }),
    landing('answers', { parent: 'faq' }),
  ];

  function run(segments: string[]): Promise<unknown> {
    return evaluateGroqExpression(landingPageQuery.query, dataset, null, {
      slug: segments.at(-1),
      path: segments.join('/'),
      locale: EN,
      defaultLocale: EN,
    });
  }

  it('returns the page and its ancestors, nearest first', async () => {
    expect(await run(['modules', 'faq', 'answers'])).toMatchObject({
      sectionChain: [
        { _id: 'answers', path: 'modules/faq/answers' },
        { _id: 'faq', path: 'modules/faq' },
        { _id: 'modules', path: 'modules' },
      ],
    });
  });

  it("returns a section root's children in drag order, in the page's language", async () => {
    expect(await run(['modules', 'faq'])).toMatchObject({
      sectionChain: [
        { _id: 'faq', sectionNavigation: false, children: null },
        {
          _id: 'modules',
          title: 'modules heading',
          sectionNavigation: true,
          children: [
            { _id: 'faq', title: 'faq heading', path: 'modules/faq' },
            {
              _id: 'pricing',
              title: 'pricing heading',
              path: 'modules/pricing',
            },
          ],
        },
      ],
    });
  });
});
