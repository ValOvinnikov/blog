import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  MOCK_ABOUT_EN_PAGE_ID,
  MOCK_ABOUT_NL_PAGE_ID,
  MOCK_ABOUT_NL_SLUG,
  MOCK_ABOUT_SLUG,
  MOCK_ABOUT_TRANSLATION_METADATA_ID,
  MOCK_PRICING_EN_PAGE_ID,
  MOCK_PRICING_NL_PAGE_ID,
  MOCK_PRICING_NL_SLUG,
  MOCK_PRICING_SLUG,
  MOCK_TEAM_EN_PAGE_ID,
  MOCK_TEAM_NL_PAGE_ID,
  MOCK_TEAM_SLUG,
  mockLandingPageDocument,
  mockTranslationMetadata,
} from '@blog/service/testing/shared/translated-pages-dataset';

import { translationMapQuery } from './query';
import {
  findTranslationGroup,
  toTranslationMap,
  type TRawTranslationMap,
} from './transformer';

const { EN, NL, DE } = LOCALE_ISO_CODES;

const dataset = [
  mockLandingPageDocument(MOCK_ABOUT_EN_PAGE_ID, EN, MOCK_ABOUT_SLUG),
  mockLandingPageDocument(MOCK_ABOUT_NL_PAGE_ID, NL, MOCK_ABOUT_NL_SLUG),
  mockLandingPageDocument('about-de', DE, 'ueber-uns'),
  mockLandingPageDocument(MOCK_PRICING_EN_PAGE_ID, EN, MOCK_PRICING_SLUG),
  mockLandingPageDocument(
    `drafts.${MOCK_PRICING_NL_PAGE_ID}`,
    NL,
    MOCK_PRICING_NL_SLUG,
  ),
  mockLandingPageDocument(MOCK_TEAM_EN_PAGE_ID, EN, MOCK_TEAM_SLUG),
  mockLandingPageDocument(MOCK_TEAM_NL_PAGE_ID, NL),
  mockTranslationMetadata(MOCK_ABOUT_TRANSLATION_METADATA_ID, [
    [EN, MOCK_ABOUT_EN_PAGE_ID],
    [NL, MOCK_ABOUT_NL_PAGE_ID],
    [DE, 'about-de'],
  ]),
  mockTranslationMetadata('meta-pricing', [
    [EN, MOCK_PRICING_EN_PAGE_ID],
    [NL, MOCK_PRICING_NL_PAGE_ID],
  ]),
  mockTranslationMetadata('meta-team', [
    [EN, MOCK_TEAM_EN_PAGE_ID],
    [NL, MOCK_TEAM_NL_PAGE_ID],
  ]),
];

function groupWithSlug(
  groups: Awaited<ReturnType<typeof buildMap>>['groups'],
  language: string,
  slug: string,
) {
  return groups.find((group) =>
    group.some(
      (member) => member.language === language && member.slug === slug,
    ),
  );
}

async function buildMap(documents: unknown[]) {
  const raw = await evaluateGroqExpression(
    translationMapQuery.query,
    documents,
    undefined,
  );
  return toTranslationMap(raw as TRawTranslationMap, EN);
}

describe('toTranslationMap', () => {
  it('groups every language of a translated page with its slug', async () => {
    const { groups } = await buildMap(dataset);

    expect(groupWithSlug(groups, EN, MOCK_ABOUT_SLUG)).toEqual([
      { documentType: 'page_landing', language: EN, slug: MOCK_ABOUT_SLUG },
      { documentType: 'page_landing', language: NL, slug: MOCK_ABOUT_NL_SLUG },
      { documentType: 'page_landing', language: DE, slug: 'ueber-uns' },
    ]);
  });

  it('drops a translation that exists only as a draft', async () => {
    const { groups } = await buildMap(dataset);

    expect(groupWithSlug(groups, EN, MOCK_PRICING_SLUG)).toEqual([
      { documentType: 'page_landing', language: EN, slug: MOCK_PRICING_SLUG },
    ]);
  });

  it('drops a published translation that has no slug', async () => {
    const { groups } = await buildMap(dataset);

    expect(groupWithSlug(groups, EN, MOCK_TEAM_SLUG)).toEqual([
      { documentType: 'page_landing', language: EN, slug: MOCK_TEAM_SLUG },
    ]);
  });

  it('is empty for a tenant with no translations', async () => {
    expect(
      await buildMap([
        mockLandingPageDocument(MOCK_ABOUT_EN_PAGE_ID, EN, MOCK_ABOUT_SLUG),
      ]),
    ).toEqual({
      groups: [],
      homeLanguages: [],
      postIndexLanguages: [],
      topicIndexLanguages: [],
      tagIndexLanguages: [],
    });
  });

  it('lists every language that has a Home, linked or not', async () => {
    const { homeLanguages } = await buildMap([
      ...dataset,
      { _id: 'page_home', _type: 'page_home', language: EN },
      { _id: 'home-nl', _type: 'page_home', language: NL },
    ]);

    expect(homeLanguages).toEqual([EN, NL]);
  });

  it('counts a Home with no language as the default language', async () => {
    const { homeLanguages } = await buildMap([
      { _id: 'page_home', _type: 'page_home' },
      { _id: 'home-de', _type: 'page_home', language: DE },
    ]);

    expect(homeLanguages).toEqual([EN, DE]);
  });

  it('lists every language that has each list page', async () => {
    const map = await buildMap([
      { _id: 'page_postIndex', _type: 'page_postIndex', language: EN },
      { _id: 'post-index-nl', _type: 'page_postIndex', language: NL },
      { _id: 'page_topicIndex', _type: 'page_topicIndex' },
      { _id: 'tag-index-de', _type: 'page_tagIndex', language: DE },
    ]);

    expect(map).toMatchObject({
      postIndexLanguages: [EN, NL],
      topicIndexLanguages: [EN],
      tagIndexLanguages: [DE],
    });
  });
});

describe('findTranslationGroup', () => {
  it('finds the group from a non-default-language member', async () => {
    const map = await buildMap(dataset);

    expect(
      findTranslationGroup(map, {
        documentType: 'page_landing',
        language: NL,
        slug: MOCK_ABOUT_NL_SLUG,
      }),
    ).toEqual(groupWithSlug(map.groups, EN, MOCK_ABOUT_SLUG));
  });

  it('is undefined when the slug matches no member', async () => {
    const map = await buildMap(dataset);

    expect(
      findTranslationGroup(map, {
        documentType: 'page_landing',
        language: NL,
        slug: MOCK_ABOUT_SLUG,
      }),
    ).toBeUndefined();
  });

  it('is undefined when the document type differs', async () => {
    const map = await buildMap(dataset);

    expect(
      findTranslationGroup(map, {
        documentType: 'post',
        language: EN,
        slug: MOCK_ABOUT_SLUG,
      }),
    ).toBeUndefined();
  });
});
