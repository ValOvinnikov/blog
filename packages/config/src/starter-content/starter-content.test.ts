import { faker } from '@faker-js/faker';

import {
  LOCALE_ISO_CODES,
  PORTABLE_TEXT_BLOCK_TYPE,
  PRICE_PERIOD,
  SEO_META_DESCRIPTION_MAX_LENGTH,
  SEO_META_TITLE_MAX_LENGTH,
  SEO_META_TITLE_MIN_LENGTH,
  SEO_OG_DESCRIPTION_MAX_LENGTH,
  SEO_OG_TITLE_MAX_LENGTH,
  SITE_TYPE,
} from '@shinefold/config/constants';
import { MOCK_PLACEHOLDER_IMAGES } from '@shinefold/config/testing/placeholder-images';
import { SITE_MESSAGES_BY_LOCALE } from '@shinefold/config/voice';

import { STARTER_COPY_BY_LOCALE } from './copy/starter-copy';
import { buildGrowthLayer } from './growth-layer';
import {
  buildStarterCookieStatement,
  buildStarterDocuments,
  toStarterSiteType,
} from './starter-content';
import type { TStarterDocumentUnion } from './starter-document';

type TStarterType = TStarterDocumentUnion['_type'];

faker.seed(6028);

const MOCK_SITE_NAME = faker.company.name();
const MOCK_OTHER_SITE_NAME = faker.company.name();
const MOCK_PUBLISHED_AT = '2026-10-21T09:00:00.000Z';
const STARTER_SITE_TYPES = [
  SITE_TYPE.BLOG,
  SITE_TYPE.PORTFOLIO,
  SITE_TYPE.PERSONAL,
  SITE_TYPE.DOCS,
  SITE_TYPE.BUSINESS,
  SITE_TYPE.PRODUCT,
  SITE_TYPE.BLANK,
] as const;
const LOCALES = Object.values(LOCALE_ISO_CODES);
const COOKIE_STATEMENT_TYPE = 'page_cookieStatement';
const BUSINESS_COPY = STARTER_COPY_BY_LOCALE.EN.business;
const GROWTH_SITE_TYPES = [
  SITE_TYPE.PORTFOLIO,
  SITE_TYPE.PERSONAL,
  SITE_TYPE.BUSINESS,
  SITE_TYPE.PRODUCT,
] as const;

const build = (
  siteType: (typeof STARTER_SITE_TYPES)[number] = SITE_TYPE.BLANK,
  locale: (typeof LOCALES)[number] = LOCALE_ISO_CODES.EN,
  siteName = MOCK_SITE_NAME,
) =>
  buildStarterDocuments({
    siteType,
    siteName,
    locale,
    publishedAt: MOCK_PUBLISHED_AT,
  });

function findByType<TType extends TStarterType>(
  documents: TStarterDocumentUnion[],
  type: TType,
) {
  const document = documents.find(
    (doc): doc is Extract<TStarterDocumentUnion, { _type: TType }> =>
      doc._type === type,
  );
  if (!document) throw new Error(`no ${type} starter document`);
  return document;
}

const byId = (documents: TStarterDocumentUnion[], id?: string) =>
  documents.find(({ _id }) => _id === id);

const pageBehind = (documents: TStarterDocumentUnion[], linkId?: string) => {
  const link = byId(documents, linkId);
  return link && 'internalReference' in link
    ? byId(documents, link.internalReference?._ref)
    : undefined;
};

const slugOf = (document?: TStarterDocumentUnion) =>
  document && 'slug' in document ? document.slug?.current : undefined;

const sectionTarget = (
  documents: TStarterDocumentUnion[],
  section?: TStarterDocumentUnion,
) => {
  if (section && 'post' in section) return byId(documents, section.post?._ref);
  if (section && 'ctaButtons' in section)
    return pageBehind(documents, section.ctaButtons?.[0]?.link?._ref);
  return undefined;
};

function homeSections(documents: TStarterDocumentUnion[]) {
  const { hero, modules = [] } = findByType(documents, 'template_home');
  return [hero, ...modules].map((slot) => {
    const section = byId(documents, slot?._ref);
    return { section, target: sectionTarget(documents, section) };
  });
}

const homeOrder = (documents: TStarterDocumentUnion[]) =>
  homeSections(documents).map(({ section, target }) => ({
    _type: section?._type,
    target: target?._type,
  }));

const parentRefs = (documents: TStarterDocumentUnion[]) =>
  documents.flatMap((document) =>
    'parent' in document && document.parent ? [document.parent._ref] : [],
  );

const imageAssetRefs = (
  items: { image?: { asset?: { _ref: string } } }[] = [],
) => new Set(items.map(({ image }) => image?.asset?._ref));

function referencedIds(documents: TStarterDocumentUnion[]): string[] {
  const ids: string[] = [];
  JSON.stringify(documents, (key, value: unknown) => {
    if (key === '_ref') ids.push(String(value));
    return value;
  });
  return ids;
}

const inEveryLocale = <TSiteType extends (typeof STARTER_SITE_TYPES)[number]>(
  siteTypes: readonly TSiteType[],
) =>
  siteTypes.flatMap((siteType) =>
    LOCALES.map((locale) => [siteType, locale] as const),
  );

const everyCombination = inEveryLocale(STARTER_SITE_TYPES);

describe(buildStarterDocuments, () => {
  it('builds the Blank site from the base documents only', () => {
    const types = build().map(({ _type }) => _type);

    expect(types).toEqual([
      'settings_navigation',
      'settings_footer',
      'settings_site',
      'template_home',
      'page_home',
      'template_postIndex',
      'page_postIndex',
      'page_cookieStatement',
      'template_privacyIndex',
      'page_privacyIndex',
      'link',
      'module_content',
      'template_legalIndex',
      'page_legalIndex',
    ]);
  });

  it.each(everyCombination)(
    '%s in %s builds unique ids',
    (siteType, locale) => {
      const ids = build(siteType, locale).map(({ _id }) => _id);

      expect(new Set(ids).size).toBe(ids.length);
    },
  );

  it.each(everyCombination)(
    '%s in %s builds published documents only',
    (siteType, locale) => {
      const draftIds = build(siteType, locale)
        .map(({ _id }) => _id)
        .filter((id) => id.startsWith('drafts.'));

      expect(draftIds).toEqual([]);
    },
  );

  it.each(everyCombination)(
    '%s in %s builds references that all resolve',
    (siteType, locale) => {
      const documents = build(siteType, locale);
      const ids = documents.map(({ _id }) => _id);

      const dangling = referencedIds(documents).filter(
        (id) => !ids.includes(id),
      );

      expect(dangling).toEqual([]);
    },
  );

  it.each(STARTER_SITE_TYPES)(
    '%s builds the same ids whatever the site name and locale, the cookie statement aside',
    (siteType) => {
      const [firstIds, secondIds] = [
        build(siteType, LOCALE_ISO_CODES.EN, MOCK_SITE_NAME),
        build(siteType, LOCALE_ISO_CODES.DE, MOCK_OTHER_SITE_NAME),
      ].map((documents) =>
        documents
          .filter(({ _type }) => _type !== COOKIE_STATEMENT_TYPE)
          .map(({ _id }) => _id),
      );

      expect(firstIds).toEqual(secondIds);
    },
  );

  it.each(LOCALES)(
    'gives the %s cookie statement the same id on every site type',
    (locale) => {
      const ids = STARTER_SITE_TYPES.map(
        (siteType) =>
          findByType(build(siteType, locale), COOKIE_STATEMENT_TYPE)._id,
      );

      expect(new Set(ids).size).toBe(1);
    },
  );

  it.each(LOCALES)(
    'builds the %s cookie statement on its own exactly as the starter site seeds it',
    (locale) => {
      expect(buildStarterCookieStatement(locale)).toEqual(
        findByType(build(SITE_TYPE.BLANK, locale), COOKIE_STATEMENT_TYPE),
      );
    },
  );

  it('gives each language its own cookie statement id', () => {
    const ids = LOCALES.map(
      (locale) =>
        findByType(build(SITE_TYPE.BLANK, locale), COOKIE_STATEMENT_TYPE)._id,
    );

    expect(new Set(ids).size).toBe(LOCALES.length);
  });

  it.each(everyCombination)(
    '%s in %s seeds a cookie statement with a cookie list and a cookie-preferences link',
    (siteType, locale) => {
      const { language, content = [] } = findByType(
        build(siteType, locale),
        COOKIE_STATEMENT_TYPE,
      );
      const preferencesLinks = content.flatMap((block) =>
        block._type === 'block'
          ? (block.children ?? []).filter(({ marks = [] }) =>
              (block.markDefs ?? []).some(
                ({ _key, _type }) =>
                  _type === PORTABLE_TEXT_BLOCK_TYPE.COOKIE_PREFERENCES_LINK &&
                  marks.includes(_key),
              ),
            )
          : [],
      );

      expect(language).toBe(locale);
      expect(
        content.filter(
          ({ _type }) => _type === PORTABLE_TEXT_BLOCK_TYPE.COOKIE_LIST,
        ),
      ).toHaveLength(1);
      expect(preferencesLinks).toHaveLength(1);
    },
  );

  it.each(everyCombination)(
    '%s in %s seeds a legal hub whose modules link the cookie statement',
    (siteType, locale) => {
      const documents = build(siteType, locale);
      const { template } = findByType(documents, 'page_legalIndex');
      const legalTemplate = byId(documents, template._ref);
      const linkedIds = referencedIds(
        legalTemplate && 'modules' in legalTemplate
          ? (legalTemplate.modules ?? []).flatMap(({ _ref }) => {
              const module = byId(documents, _ref);
              return module ? [module] : [];
            })
          : [],
      );
      const linkTargets = linkedIds.flatMap((id) => {
        const page = pageBehind(documents, id);
        return page ? [page._type] : [];
      });

      expect(linkTargets).toEqual([COOKIE_STATEMENT_TYPE]);
    },
  );

  it('the Blog site keeps every base document id the Blank site seeds', () => {
    const blogIds = build(SITE_TYPE.BLOG).map(({ _id }) => _id);

    const missing = build()
      .map(({ _id }) => _id)
      .filter((id) => !blogIds.includes(id));

    expect(missing).toEqual([]);
  });

  it.each(STARTER_SITE_TYPES)(
    'the %s site types every module slot as the module it references',
    (siteType) => {
      const documents = build(siteType);

      const mismatched = documents.flatMap((document) =>
        'modules' in document
          ? (document.modules ?? []).flatMap(({ _type, _ref }) =>
              byId(documents, _ref)?._type === _type ? [] : [_ref],
            )
          : [],
      );

      expect(mismatched).toEqual([]);
    },
  );

  it('the Blank home template has no hero and no modules', () => {
    const { hero, modules } = findByType(build(), 'template_home');

    expect({ hero, modules }).toStrictEqual({
      hero: undefined,
      modules: undefined,
    });
  });

  it('opens the Blog home with a hero pinning a post, then posts, topics and a CTA', () => {
    expect(homeOrder(build(SITE_TYPE.BLOG))).toEqual([
      { _type: 'module_heroBlog', target: 'page_post' },
      { _type: 'module_postLatest', target: undefined },
      { _type: 'module_taxonomyList', target: undefined },
      { _type: 'module_cta', target: 'page_landing' },
    ]);
  });

  it('the Portfolio sample projects are two pages under one parent', () => {
    const parents = parentRefs(build(SITE_TYPE.PORTFOLIO));

    expect(parents).toEqual([parents[0], parents[0]]);
  });

  it('opens the Personal home with a profile hero, then an introduction, questions and a CTA to the post index', () => {
    expect(homeOrder(build(SITE_TYPE.PERSONAL))).toEqual([
      { _type: 'module_heroProfile', target: undefined },
      { _type: 'module_content', target: undefined },
      { _type: 'module_faq', target: undefined },
      { _type: 'module_cta', target: 'page_postIndex' },
    ]);
  });

  it('opens the Docs home with a statement hero linking to the guides, then an introduction and questions', () => {
    expect(homeOrder(build(SITE_TYPE.DOCS))).toEqual([
      { _type: 'module_heroStatement', target: 'page_landing' },
      { _type: 'module_content', target: undefined },
      { _type: 'module_faq', target: undefined },
    ]);
  });

  it('the Docs guides are three pages under the page that turns on section navigation', () => {
    const landings = build(SITE_TYPE.DOCS).filter(
      (document) => document._type === 'page_landing',
    );
    const section = landings.find(
      (document) =>
        'sectionNavigation' in document && document.sectionNavigation,
    );

    expect(parentRefs(landings)).toEqual([
      section?._id,
      section?._id,
      section?._id,
    ]);
  });

  describe('the Business site', () => {
    let documents: TStarterDocumentUnion[];

    beforeEach(() => {
      documents = build(SITE_TYPE.BUSINESS);
    });

    it('opens the home on a services hero and closes on a contact CTA', () => {
      const sequence = homeSections(documents).map(({ section, target }) => ({
        _type: section?._type,
        actionTarget: slugOf(target),
      }));

      expect(sequence).toEqual([
        {
          _type: 'module_heroStatement',
          actionTarget: BUSINESS_COPY.services.slug,
        },
        { _type: 'module_content', actionTarget: undefined },
        { _type: 'module_faq', actionTarget: undefined },
        { _type: 'module_cta', actionTarget: BUSINESS_COPY.contact.slug },
      ]);
    });

    it('links the navigation to three top-level pages', () => {
      const { items = [] } = findByType(documents, 'settings_navigation');

      const targets = items.map((item) => {
        const page = pageBehind(
          documents,
          'link' in item ? item.link?._ref : undefined,
        );
        return { slug: slugOf(page), hasParent: !!page && 'parent' in page };
      });

      expect(targets).toEqual([
        { slug: BUSINESS_COPY.services.slug, hasParent: false },
        { slug: BUSINESS_COPY.about.slug, hasParent: false },
        { slug: BUSINESS_COPY.contact.slug, hasParent: false },
      ]);
    });
  });

  describe('the Product site', () => {
    let documents: TStarterDocumentUnion[];

    beforeEach(() => {
      documents = build(SITE_TYPE.PRODUCT);
    });

    it('opens the home on a changelog hero and closes on a changelog CTA', () => {
      expect(homeOrder(documents)).toEqual([
        { _type: 'module_heroStatement', target: 'page_postIndex' },
        { _type: 'module_content', target: undefined },
        { _type: 'module_faq', target: undefined },
        { _type: 'module_cta', target: 'page_postIndex' },
      ]);
    });

    it('lists the changelog on the post index template', () => {
      const { modules = [] } = findByType(documents, 'template_postIndex');

      const listed = modules.map(({ _ref }) => byId(documents, _ref)?._type);

      expect(listed).toEqual(['module_postList']);
    });
  });

  it('the NL home page takes its copy from the Dutch catalogue', () => {
    const { headingBlock } = findByType(
      build(SITE_TYPE.BLANK, LOCALE_ISO_CODES.NL),
      'page_home',
    );

    expect(headingBlock.heading).toBe(STARTER_COPY_BY_LOCALE.NL.home.heading);
  });

  it.each(LOCALES)(
    'the %s Site Settings word each price period from that language catalogue',
    (locale) => {
      const { pricePeriodSuffix } = findByType(
        build(SITE_TYPE.BLANK, locale),
        'settings_site',
      );
      const { period } = SITE_MESSAGES_BY_LOCALE[locale].pricingModule;

      for (const value of Object.values(PRICE_PERIOD)) {
        expect(pricePeriodSuffix?.[value]).toEqual([
          expect.objectContaining({ language: locale, value: period[value] }),
        ]);
      }
    },
  );

  it.each(LOCALES)(
    'every localized value in the %s Blog site is tagged with that locale',
    (locale) => {
      const languages = JSON.stringify(build(SITE_TYPE.BLOG, locale)).match(
        /"language":"[A-Z]+"/g,
      );

      expect(new Set(languages)).toEqual(new Set([`"language":"${locale}"`]));
    },
  );

  it.each(everyCombination)(
    'every page seo in %s / %s stays within the schema bounds',
    (siteType, locale) => {
      const seos = build(siteType, locale).flatMap((doc) =>
        'seo' in doc && doc.seo ? [doc.seo] : [],
      );

      for (const { metaTitle = '', metaDescription = '', openGraph } of seos) {
        expect(metaTitle.length).toBeGreaterThanOrEqual(
          SEO_META_TITLE_MIN_LENGTH,
        );
        expect(metaTitle.length).toBeLessThanOrEqual(SEO_META_TITLE_MAX_LENGTH);
        expect(metaDescription.length).toBeLessThanOrEqual(
          SEO_META_DESCRIPTION_MAX_LENGTH,
        );
        expect(openGraph?.ogTitle?.length).toBeLessThanOrEqual(
          SEO_OG_TITLE_MAX_LENGTH,
        );
        expect(openGraph?.ogDescription?.length).toBeLessThanOrEqual(
          SEO_OG_DESCRIPTION_MAX_LENGTH,
        );
      }
    },
  );
});

describe(toStarterSiteType, () => {
  it('keeps a site type that has a template', () => {
    expect(toStarterSiteType(SITE_TYPE.BLOG)).toBe(SITE_TYPE.BLOG);
  });

  it('starts a tenant with no site type from the Blank site', () => {
    expect(toStarterSiteType(null)).toBe(SITE_TYPE.BLANK);
  });
});

describe(buildGrowthLayer, () => {
  const growthCombination = inEveryLocale(GROWTH_SITE_TYPES);

  const layerOf = (
    siteType: (typeof STARTER_SITE_TYPES)[number],
    locale: (typeof LOCALES)[number] = LOCALE_ISO_CODES.EN,
  ) =>
    buildGrowthLayer({
      siteType,
      locale,
      placeholderImages: MOCK_PLACEHOLDER_IMAGES,
    });

  const requireLayer = (
    ...args: Parameters<typeof layerOf>
  ): NonNullable<ReturnType<typeof layerOf>> => {
    const layer = layerOf(...args);
    if (!layer) throw new Error(`no Growth layer for ${args[0]}`);
    return layer;
  };

  const homeModuleIds = (documents: TStarterDocumentUnion[]) =>
    (findByType(documents, 'template_home').modules ?? []).map(
      ({ _ref }) => _ref,
    );

  it.each([SITE_TYPE.BLOG, SITE_TYPE.DOCS, SITE_TYPE.BLANK])(
    'builds no layer for %s',
    (siteType) => {
      expect(layerOf(siteType)).toBeNull();
    },
  );

  it.each(growthCombination)(
    '%s in %s adds only ids the Free site does not seed',
    (siteType, locale) => {
      const starterIds = build(siteType, locale).map(({ _id }) => _id);
      const layerIds = requireLayer(siteType, locale).documents.map(
        ({ _id }) => _id,
      );

      expect(new Set(layerIds).size).toBe(layerIds.length);
      expect(layerIds.filter((id) => starterIds.includes(id))).toEqual([]);
    },
  );

  it.each(growthCombination)(
    '%s in %s builds references that resolve to the site or a placeholder image',
    (siteType, locale) => {
      const { documents } = requireLayer(siteType, locale);
      const knownIds = [...build(siteType, locale), ...documents].map(
        ({ _id }) => _id,
      );
      const placeholderIds: string[] = Object.values(MOCK_PLACEHOLDER_IMAGES);

      const dangling = referencedIds(documents).filter(
        (id) => !knownIds.includes(id) && !placeholderIds.includes(id),
      );

      expect(dangling).toEqual([]);
    },
  );

  it.each(growthCombination)(
    '%s in %s writes every localised value in that locale',
    (siteType, locale) => {
      const languages = new Set<unknown>();
      JSON.stringify(requireLayer(siteType, locale).documents, (key, value) => {
        if (key === 'language') languages.add(value);
        return value;
      });

      expect([...languages]).toEqual([locale]);
    },
  );

  it.each(GROWTH_SITE_TYPES)(
    'the %s home slots each reference a layer document of their type',
    (siteType) => {
      const { documents, homeSlots } = requireLayer(siteType);

      const mismatched = homeSlots.flatMap(({ slot: { _ref, _type } }) =>
        byId(documents, _ref)?._type === _type ? [] : [_ref],
      );

      expect(mismatched).toEqual([]);
    },
  );

  it.each([
    [
      SITE_TYPE.PORTFOLIO,
      [
        'module_content',
        'module_featureHighlights',
        'module_logoWall',
        'module_timeline',
        'module_testimonial',
        'module_cta',
      ],
    ],
    [
      SITE_TYPE.PERSONAL,
      [
        'module_content',
        'module_timeline',
        'module_featureList',
        'module_faq',
        'module_cta',
      ],
    ],
    [
      SITE_TYPE.BUSINESS,
      [
        'module_content',
        'module_featureList',
        'module_stats',
        'module_logoWall',
        'module_team',
        'module_testimonial',
        'module_faq',
        'module_cta',
      ],
    ],
    [
      SITE_TYPE.PRODUCT,
      [
        'module_content',
        'module_featureHighlights',
        'module_featureList',
        'module_stats',
        'module_testimonial',
        'module_logoWall',
        'module_pricing',
        'module_faq',
        'module_cta',
      ],
    ],
  ] as const)(
    'places the %s Growth sections in the Free home',
    (siteType, expected) => {
      const starter = build(siteType);
      const { documents, homeSlots } = requireLayer(siteType);
      const home = homeSlots.reduce((ids, { slot, after }) => {
        const index = ids.indexOf(after);
        return [...ids.slice(0, index + 1), slot._ref, ...ids.slice(index + 1)];
      }, homeModuleIds(starter));

      expect(
        home.map((id) => byId([...starter, ...documents], id)?._type),
      ).toEqual(expected);
    },
  );

  it.each([
    SITE_TYPE.PORTFOLIO,
    SITE_TYPE.BUSINESS,
    SITE_TYPE.PRODUCT,
  ] as const)('gives the %s logo wall the logo placeholder', (siteType) => {
    const logoWall = findByType(
      requireLayer(siteType).documents,
      'module_logoWall',
    );

    expect(imageAssetRefs(logoWall.logos)).toEqual(
      new Set([MOCK_PLACEHOLDER_IMAGES.LOGO]),
    );
  });

  it.each([SITE_TYPE.PORTFOLIO, SITE_TYPE.PRODUCT] as const)(
    'gives the %s highlights the illustration placeholder',
    (siteType) => {
      const highlights = findByType(
        requireLayer(siteType).documents,
        'module_featureHighlights',
      );

      expect(imageAssetRefs(highlights.highlights)).toEqual(
        new Set([MOCK_PLACEHOLDER_IMAGES.ILLUSTRATION]),
      );
    },
  );
});
