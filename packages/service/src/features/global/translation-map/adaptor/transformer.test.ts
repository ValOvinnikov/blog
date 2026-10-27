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
import { faker } from '@faker-js/faker';

import { translationMapQuery } from './query';
import {
  findTranslationGroup,
  toTranslationMap,
  type TRawTranslationMap,
} from './transformer';

faker.seed(6015108);

const { EN, NL, DE } = LOCALE_ISO_CODES;

const MOCK_ABOUT_DE_PAGE_ID = faker.string.uuid();
const MOCK_ABOUT_DE_SLUG = faker.lorem.slug();
const MOCK_PRICING_METADATA_ID = faker.string.uuid();
const MOCK_TEAM_METADATA_ID = faker.string.uuid();
const MOCK_HOME_EN_ID = faker.string.uuid();
const MOCK_HOME_NL_ID = faker.string.uuid();
const MOCK_HOME_DE_ID = faker.string.uuid();
const MOCK_POST_INDEX_EN_ID = faker.string.uuid();
const MOCK_POST_INDEX_NL_ID = faker.string.uuid();
const MOCK_TOPIC_INDEX_ID = faker.string.uuid();
const MOCK_TAG_INDEX_DE_ID = faker.string.uuid();

const MOCK_DATASET = [
  mockLandingPageDocument(MOCK_ABOUT_EN_PAGE_ID, EN, MOCK_ABOUT_SLUG),
  mockLandingPageDocument(MOCK_ABOUT_NL_PAGE_ID, NL, MOCK_ABOUT_NL_SLUG),
  mockLandingPageDocument(MOCK_ABOUT_DE_PAGE_ID, DE, MOCK_ABOUT_DE_SLUG),
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
    [DE, MOCK_ABOUT_DE_PAGE_ID],
  ]),
  mockTranslationMetadata(MOCK_PRICING_METADATA_ID, [
    [EN, MOCK_PRICING_EN_PAGE_ID],
    [NL, MOCK_PRICING_NL_PAGE_ID],
  ]),
  mockTranslationMetadata(MOCK_TEAM_METADATA_ID, [
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

describe(toTranslationMap, () => {
  it('groups every language of a translated page with its slug', async () => {
    const { groups } = await buildMap(MOCK_DATASET);

    expect(groupWithSlug(groups, EN, MOCK_ABOUT_SLUG)).toEqual([
      { documentType: 'page_landing', language: EN, slug: MOCK_ABOUT_SLUG },
      { documentType: 'page_landing', language: NL, slug: MOCK_ABOUT_NL_SLUG },
      { documentType: 'page_landing', language: DE, slug: MOCK_ABOUT_DE_SLUG },
    ]);
  });

  it('drops a translation that exists only as a draft', async () => {
    const { groups } = await buildMap(MOCK_DATASET);

    expect(groupWithSlug(groups, EN, MOCK_PRICING_SLUG)).toEqual([
      { documentType: 'page_landing', language: EN, slug: MOCK_PRICING_SLUG },
    ]);
  });

  it('drops a published translation that has no slug', async () => {
    const { groups } = await buildMap(MOCK_DATASET);

    expect(groupWithSlug(groups, EN, MOCK_TEAM_SLUG)).toEqual([
      { documentType: 'page_landing', language: EN, slug: MOCK_TEAM_SLUG },
    ]);
  });

  it('is empty for a tenant with no translations', async () => {
    const map = await buildMap([
      mockLandingPageDocument(MOCK_ABOUT_EN_PAGE_ID, EN, MOCK_ABOUT_SLUG),
    ]);

    expect(map).toEqual({
      groups: [],
      homeLanguages: [],
      postIndexLanguages: [],
      topicIndexLanguages: [],
      tagIndexLanguages: [],
    });
  });

  it('lists every language that has a Home, linked or not', async () => {
    const { homeLanguages } = await buildMap([
      ...MOCK_DATASET,
      { _id: MOCK_HOME_EN_ID, _type: 'page_home', language: EN },
      { _id: MOCK_HOME_NL_ID, _type: 'page_home', language: NL },
    ]);

    expect(homeLanguages).toEqual([EN, NL]);
  });

  it('counts a Home with no language as the default language', async () => {
    const { homeLanguages } = await buildMap([
      { _id: MOCK_HOME_EN_ID, _type: 'page_home' },
      { _id: MOCK_HOME_DE_ID, _type: 'page_home', language: DE },
    ]);

    expect(homeLanguages).toEqual([EN, DE]);
  });

  it('lists every language that has each list page', async () => {
    const { postIndexLanguages, topicIndexLanguages, tagIndexLanguages } =
      await buildMap([
        { _id: MOCK_POST_INDEX_EN_ID, _type: 'page_postIndex', language: EN },
        { _id: MOCK_POST_INDEX_NL_ID, _type: 'page_postIndex', language: NL },
        { _id: MOCK_TOPIC_INDEX_ID, _type: 'page_topicIndex' },
        { _id: MOCK_TAG_INDEX_DE_ID, _type: 'page_tagIndex', language: DE },
      ]);

    expect(postIndexLanguages).toEqual([EN, NL]);
    expect(topicIndexLanguages).toEqual([EN]);
    expect(tagIndexLanguages).toEqual([DE]);
  });
});

describe(findTranslationGroup, () => {
  it('finds the group from a non-default-language member', async () => {
    const map = await buildMap(MOCK_DATASET);

    expect(
      findTranslationGroup(map, {
        documentType: 'page_landing',
        language: NL,
        slug: MOCK_ABOUT_NL_SLUG,
      }),
    ).toEqual(groupWithSlug(map.groups, EN, MOCK_ABOUT_SLUG));
  });

  it('is undefined when the slug matches no member', async () => {
    const map = await buildMap(MOCK_DATASET);

    expect(
      findTranslationGroup(map, {
        documentType: 'page_landing',
        language: NL,
        slug: MOCK_ABOUT_SLUG,
      }),
    ).toBeUndefined();
  });

  it('is undefined when the document type differs', async () => {
    const map = await buildMap(MOCK_DATASET);

    expect(
      findTranslationGroup(map, {
        documentType: 'post',
        language: EN,
        slug: MOCK_ABOUT_SLUG,
      }),
    ).toBeUndefined();
  });
});
