import { faker } from '@faker-js/faker';

import { LOCALE_ISO_CODES, SITE_TYPE } from '@blog/config/constants';

import { STARTER_COPY_BY_LOCALE } from './copy/starter-copy';
import { buildStarterDocuments, toStarterSiteType } from './starter-content';
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
  SITE_TYPE.BLANK,
] as const;
const LOCALES = Object.values(LOCALE_ISO_CODES);

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
    '%s builds the same ids whatever the site name and locale',
    (siteType) => {
      const [firstIds, secondIds] = [
        build(siteType, LOCALE_ISO_CODES.EN, MOCK_SITE_NAME),
        build(siteType, LOCALE_ISO_CODES.DE, MOCK_OTHER_SITE_NAME),
      ].map((documents) => documents.map(({ _id }) => _id));

      expect(firstIds).toEqual(secondIds);
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
    const byId = (id?: string) => documents.find(({ _id }) => _id === id);
    const { hero, modules = [] } = findByType(documents, 'template_home');
    const heroDocument = byId(hero?._ref);
    const pinned =
      heroDocument && 'post' in heroDocument
        ? byId(heroDocument.post?._ref)
        : undefined;

    const sequence = [
      heroDocument,
      pinned,
      ...modules.map(({ _ref }) => byId(_ref)),
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
    const byId = (id?: string) => documents.find(({ _id }) => _id === id);
    const { hero, modules = [] } = findByType(documents, 'template_home');
    const cta = findByType(documents, 'module_cta');
    const ctaLink = byId(cta.ctaButtons?.[0]?.link?._ref);
    const ctaTarget =
      ctaLink && 'internalReference' in ctaLink
        ? byId(ctaLink.internalReference?._ref)
        : undefined;

    const sequence = [
      byId(hero?._ref),
      ...modules.map(({ _ref }) => byId(_ref)),
      ctaTarget,
    ].map((document) => ({ _type: document?._type }));

    expect(sequence).toEqual([
      { _type: 'module_heroProfile' },
      { _type: 'module_content' },
      { _type: 'module_faq' },
      { _type: 'module_cta' },
      { _type: 'page_postIndex' },
    ]);
  });

  it('the site settings brand carries the site name', () => {
    const { brand } = findByType(build(), 'settings_site');

    expect(brand?.name).toBe(MOCK_SITE_NAME);
  });

  it('the NL home page takes its copy from the Dutch catalogue', () => {
    const { headingBlock } = findByType(
      build(SITE_TYPE.BLANK, LOCALE_ISO_CODES.NL),
      'page_home',
    );

    expect(headingBlock.heading).toBe(STARTER_COPY_BY_LOCALE.NL.home.heading);
  });

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
        expect(metaTitle.length).toBeGreaterThanOrEqual(30);
        expect(metaTitle.length).toBeLessThanOrEqual(60);
        expect(metaDescription.length).toBeLessThanOrEqual(160);
        expect(openGraph?.ogTitle?.length).toBeLessThanOrEqual(70);
        expect(openGraph?.ogDescription?.length).toBeLessThanOrEqual(200);
      }
    },
  );
});

describe(toStarterSiteType, () => {
  it('keeps a site type that has a template', () => {
    expect(toStarterSiteType(SITE_TYPE.BLOG)).toBe(SITE_TYPE.BLOG);
  });

  it.each([null, SITE_TYPE.DOCS])(
    'starts %s from the Blank site',
    (siteType) => {
      expect(toStarterSiteType(siteType)).toBe(SITE_TYPE.BLANK);
    },
  );
});
