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
