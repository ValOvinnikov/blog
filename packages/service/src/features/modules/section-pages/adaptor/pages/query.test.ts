import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockReference } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { faker } from '@faker-js/faker';

import { sectionPagesQuery } from './query';

faker.seed(32);

const { EN, NL } = LOCALE_ISO_CODES;

const MOCK_HOST_ID = faker.string.uuid();
const MOCK_FIRST_CHILD_ID = faker.string.uuid();
const MOCK_SECOND_CHILD_ID = faker.string.uuid();
const MOCK_GRANDCHILD_ID = faker.string.uuid();
const MOCK_CHILDLESS_ID = faker.string.uuid();
const MOCK_DUTCH_CHILD_ID = faker.string.uuid();
const MOCK_FIRST_CHILD_SLUG = faker.lorem.slug();
const MOCK_FIRST_CHILD_HEADING = faker.lorem.words(3);
const MOCK_FIRST_CHILD_SUMMARY = faker.lorem.sentence();
const MOCK_FIRST_RANK = '0|a';
const MOCK_SECOND_RANK = '0|b';

function mockLanding(
  id: string,
  options: {
    parent?: string;
    orderRank?: string;
    language?: string;
    slug?: string;
    heading?: string;
    summary?: string;
  } = {},
) {
  const {
    parent,
    orderRank = id,
    language = EN,
    slug = id,
    heading = id,
    summary = `${id} summary`,
  } = options;

  return {
    _id: id,
    _type: 'page_landing',
    slug: { current: slug },
    language,
    orderRank,
    headingBlock: { heading, supportingText: summary },
    ...(parent ? { parent: mockReference(parent) } : {}),
  };
}

const MOCK_DATASET = [
  mockLanding(MOCK_HOST_ID),
  mockLanding(MOCK_SECOND_CHILD_ID, {
    parent: MOCK_HOST_ID,
    orderRank: MOCK_SECOND_RANK,
  }),
  mockLanding(MOCK_FIRST_CHILD_ID, {
    parent: MOCK_HOST_ID,
    orderRank: MOCK_FIRST_RANK,
    slug: MOCK_FIRST_CHILD_SLUG,
    heading: MOCK_FIRST_CHILD_HEADING,
    summary: MOCK_FIRST_CHILD_SUMMARY,
  }),
  mockLanding(MOCK_GRANDCHILD_ID, { parent: MOCK_FIRST_CHILD_ID }),
  mockLanding(MOCK_CHILDLESS_ID),
  mockLanding(MOCK_DUTCH_CHILD_ID, { parent: MOCK_HOST_ID, language: NL }),
];

async function runSectionPages(parentId: string, locale: string) {
  const raw = await evaluateGroqExpression(
    sectionPagesQuery.query,
    MOCK_DATASET,
    undefined,
    { parentId, locale, defaultLocale: EN },
  );

  return sectionPagesQuery.parse(raw);
}

describe('sectionPagesQuery', () => {
  it('returns only the direct children of the hosting page, in drag order', async () => {
    const pages = await runSectionPages(MOCK_HOST_ID, EN);

    expect(pages.map(({ _id }) => _id)).toEqual([
      MOCK_FIRST_CHILD_ID,
      MOCK_SECOND_CHILD_ID,
    ]);
  });

  it('returns only the children in the request language', async () => {
    const pages = await runSectionPages(MOCK_HOST_ID, NL);

    expect(pages.map(({ _id }) => _id)).toEqual([MOCK_DUTCH_CHILD_ID]);
  });

  it('returns nothing for a page without children', async () => {
    const pages = await runSectionPages(MOCK_CHILDLESS_ID, EN);

    expect(pages).toEqual([]);
  });

  it('returns each child with its slug and heading block, and no unauthored image', async () => {
    const [firstChild] = await runSectionPages(MOCK_HOST_ID, EN);

    expect(firstChild).toEqual({
      _id: MOCK_FIRST_CHILD_ID,
      slug: MOCK_FIRST_CHILD_SLUG,
      headingBlock: {
        heading: MOCK_FIRST_CHILD_HEADING,
        supportingText: MOCK_FIRST_CHILD_SUMMARY,
      },
      image: null,
    });
  });
});
