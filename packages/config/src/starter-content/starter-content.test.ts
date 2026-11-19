import { faker } from '@faker-js/faker';
import { SITE_MESSAGES_BY_LOCALE } from '@shinefold/config/voice';

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

import { STARTER_COPY_BY_LOCALE } from './copy/starter-copy';
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
  SITE_TYPE.BLANK,
] as const;
const LOCALES = Object.values(LOCALE_ISO_CODES);
const COOKIE_STATEMENT_TYPE = 'page_cookieStatement';
const BUSINESS_COPY = STARTER_COPY_BY_LOCALE.EN.business;

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

function referencedIds(documents: TStarterDocumentUnion[]): string[] {
  const ids: string[] = [];
  JSON.stringify(documents, (key, value: unknown) => {
    if (key === '_ref') ids.push(String(value));
    return value;
  });
  return ids;
}

const everyCombination = STARTER_SITE_TYPES.flatMap((siteType) =>
  LOCALES.map((locale) => [siteType, locale] as const),
);

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

  it('the Blank home template has no hero and no modules', () => {
    const { hero, modules } = findByType(build(), 'template_home');

    expect({ hero, modules }).toStrictEqual({
      hero: undefined,
      modules: undefined,
    });
  });

  it('opens the Blog home with a hero pinning a post, then posts, topics and a CTA', () => {
    const documents = build(SITE_TYPE.BLOG);
    const { hero, modules = [] } = findByType(documents, 'template_home');
    const heroDocument = byId(documents, hero?._ref);
    const pinned =
      heroDocument && 'post' in heroDocument
        ? byId(documents, heroDocument.post?._ref)
        : undefined;

    const sequence = [
      heroDocument,
      pinned,
      ...modules.map(({ _ref }) => byId(documents, _ref)),
    ].map((document) => ({ _type: document?._type }));

    expect(sequence).toEqual([
      { _type: 'module_heroBlog' },
      { _type: 'page_post' },
      { _type: 'module_postLatest' },
      { _type: 'module_taxonomyList' },
      { _type: 'module_cta' },
    ]);
  });

  it('the Portfolio sample projects are two pages under one parent', () => {
    const parents = build(SITE_TYPE.PORTFOLIO).flatMap((document) =>
      'parent' in document && document.parent ? [document.parent._ref] : [],
    );

    expect(parents).toEqual([parents[0], parents[0]]);
  });

  it('opens the Personal home with a profile hero, then an introduction, questions and a CTA to the post index', () => {
    const documents = build(SITE_TYPE.PERSONAL);
    const { hero, modules = [] } = findByType(documents, 'template_home');
    const cta = findByType(documents, 'module_cta');

    const sequence = [
      byId(documents, hero?._ref),
      ...modules.map(({ _ref }) => byId(documents, _ref)),
      pageBehind(documents, cta.ctaButtons?.[0]?.link?._ref),
    ].map((document) => ({ _type: document?._type }));

    expect(sequence).toEqual([
      { _type: 'module_heroProfile' },
      { _type: 'module_content' },
      { _type: 'module_faq' },
      { _type: 'module_cta' },
      { _type: 'page_postIndex' },
    ]);
  });

  it('opens the Docs home with a statement hero linking to the guides, then an introduction and questions', () => {
    const documents = build(SITE_TYPE.DOCS);
    const { hero, modules = [] } = findByType(documents, 'template_home');
    const heroDocument = byId(documents, hero?._ref);
    const heroTarget =
      heroDocument && 'ctaButtons' in heroDocument
        ? pageBehind(documents, heroDocument.ctaButtons?.[0]?.link?._ref)
        : undefined;

    const sequence = [
      heroDocument,
      ...modules.map(({ _ref }) => byId(documents, _ref)),
      heroTarget,
    ].map((document) => ({ _type: document?._type }));

    expect(sequence).toEqual([
      { _type: 'module_heroStatement' },
      { _type: 'module_content' },
      { _type: 'module_faq' },
      { _type: 'page_landing' },
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

    const parents = landings.flatMap((document) =>
      'parent' in document && document.parent ? [document.parent._ref] : [],
    );

    expect(parents).toEqual([section?._id, section?._id, section?._id]);
  });

  describe('the Business site', () => {
    let documents: TStarterDocumentUnion[];

    beforeEach(() => {
      documents = build(SITE_TYPE.BUSINESS);
    });

    it('opens the home on a services hero and closes on a contact CTA', () => {
      const { hero, modules = [] } = findByType(documents, 'template_home');
      const sections = [hero?._ref, ...modules.map(({ _ref }) => _ref)].map(
        (id) => byId(documents, id),
      );

      const sequence = sections.map((document) => ({
        _type: document?._type,
        actionTarget:
          document && 'ctaButtons' in document
            ? slugOf(
                pageBehind(documents, document.ctaButtons?.[0]?.link?._ref),
              )
            : undefined,
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

  it.each([null, SITE_TYPE.PRODUCT])(
    'starts %s from the Blank site',
    (siteType) => {
      expect(toStarterSiteType(siteType)).toBe(SITE_TYPE.BLANK);
    },
  );
});
