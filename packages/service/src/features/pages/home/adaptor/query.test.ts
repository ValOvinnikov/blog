import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { makeRawHomePage } from '@blog/service/testing/pages/fixtures';
import { makeRawHeadingBlock } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { homePageQuery } from './query';

describe('homePageQuery', () => {
  it('parses a home page whose SEO openGraph has no image (null ogImage)', () => {
    const raw = makeRawHomePage({
      seo: {
        metaTitle: 'Home',
        metaDescription: null,
        openGraph: { ogTitle: null, ogDescription: null, ogImage: null },
      },
    });

    expect(() => homePageQuery.parse(raw)).not.toThrow();
  });

  it('rejects a home page with no authored SEO', () => {
    const raw = { ...makeRawHomePage(), seo: null };

    expect(() => homePageQuery.parse(raw)).toThrow();
  });

  it('parses null as no matching page_home document, rather than throwing', () => {
    expect(homePageQuery.parse(null)).toBeNull();
  });

  it('rejects a home page with no headingBlock', () => {
    const raw = { ...makeRawHomePage(), headingBlock: null };

    expect(() => homePageQuery.parse(raw)).toThrow();
  });

  it('parses a home page with a headingBlock heading and no hero', () => {
    const raw = makeRawHomePage({
      hero: null,
      headingBlock: makeRawHeadingBlock('Welcome'),
    });

    expect(() => homePageQuery.parse(raw)).not.toThrow();
  });

  it('parses a home page with both a hero and a headingBlock heading', () => {
    const raw = makeRawHomePage({
      headingBlock: makeRawHeadingBlock('Welcome', {
        supportingText: 'A subtitle',
      }),
    });

    expect(() => homePageQuery.parse(raw)).not.toThrow();
  });

  it('queries every module_faq question across the page', () => {
    expect(homePageQuery.query).toContain('_type == "module_faq"');
  });

  it('rejects a page whose faqs contain a null entry', () => {
    const raw = { ...makeRawHomePage(), faqs: [null] };

    expect(() => homePageQuery.parse(raw)).toThrow();
  });
});

describe('homePageQuery language scoping', () => {
  const { EN, NL, FR } = LOCALE_ISO_CODES;

  function home(id: string, heading: string, language?: string) {
    return {
      _id: id,
      _type: 'page_home',
      headingBlock: { heading },
      ...(language ? { language } : {}),
    };
  }

  function run(dataset: unknown[], locale: string): Promise<unknown> {
    return evaluateGroqExpression(homePageQuery.query, dataset, null, {
      locale,
      defaultLocale: EN,
    });
  }

  const dataset = [
    home('page_home', 'Welcome', EN),
    home('home-nl', 'Welkom', NL),
  ];

  it("resolves each language's own Home", async () => {
    expect(await run(dataset, EN)).toMatchObject({
      headingBlock: { heading: 'Welcome' },
    });
    expect(await run(dataset, NL)).toMatchObject({
      headingBlock: { heading: 'Welkom' },
    });
  });

  it('resolves nothing for a language without a Home, rather than another language', async () => {
    expect(await run(dataset, FR)).toBeNull();
  });

  it('resolves a Home with no language for the default language only', async () => {
    const legacy = [home('page_home', 'Welcome')];

    expect(await run(legacy, EN)).toMatchObject({
      headingBlock: { heading: 'Welcome' },
    });
    expect(await run(legacy, NL)).toBeNull();
  });

  it('lists the language of every Home as its translations', async () => {
    expect(await run(dataset, NL)).toMatchObject({
      translations: [{ language: EN }, { language: NL }],
    });
  });
});
