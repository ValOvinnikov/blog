import { LINK_TYPE } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { q } from '@blog/service/sanity/query/query';
import {
  MOCK_LINK_LABEL,
  mockReference,
} from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { mockLocalizedStrings } from '@blog/service/testing/shared/localized';
import {
  MOCK_ABOUT_EN_PAGE_ID,
  MOCK_ABOUT_NL_PAGE_ID,
  MOCK_ABOUT_NL_SLUG,
  MOCK_ABOUT_SLUG,
  MOCK_ABOUT_TRANSLATION_METADATA,
} from '@blog/service/testing/shared/translated-pages-dataset';
import { faker } from '@faker-js/faker';

import { linkDocumentFragment } from './link-document';

faker.seed(6017);

const { EN, NL, FR } = LOCALE_ISO_CODES;

const MOCK_LINK_ID = faker.string.uuid();
const MOCK_CONTACT_PAGE_ID = faker.string.uuid();
const MOCK_CONTACT_SLUG = faker.lorem.slug(2);
const MOCK_PARENT_PAGE_ID = faker.string.uuid();
const MOCK_PARENT_SLUG = faker.lorem.slug(2);
const MOCK_NESTED_PAGE_ID = faker.string.uuid();
const MOCK_NESTED_SLUG = faker.lorem.slug(2);
const MOCK_ENGLISH_LABEL = faker.lorem.words(2);
const MOCK_DUTCH_LABEL = faker.lorem.words(2);
const MOCK_ENGLISH_URL = faker.internet.url();
const MOCK_DUTCH_URL = faker.internet.url();

const linkDocQuery = q.star
  .filterByType('link')
  .slice(0)
  .project(linkDocumentFragment)
  .notNull();

const pages = [
  {
    _id: MOCK_ABOUT_EN_PAGE_ID,
    _type: 'page_landing',
    slug: { current: MOCK_ABOUT_SLUG },
  },
  {
    _id: MOCK_ABOUT_NL_PAGE_ID,
    _type: 'page_landing',
    slug: { current: MOCK_ABOUT_NL_SLUG },
  },
  {
    _id: MOCK_CONTACT_PAGE_ID,
    _type: 'page_landing',
    slug: { current: MOCK_CONTACT_SLUG },
  },
  {
    _id: MOCK_PARENT_PAGE_ID,
    _type: 'page_landing',
    slug: { current: MOCK_PARENT_SLUG },
  },
  {
    _id: MOCK_NESTED_PAGE_ID,
    _type: 'page_landing',
    slug: { current: MOCK_NESTED_SLUG },
    parent: mockReference(MOCK_PARENT_PAGE_ID),
  },
  MOCK_ABOUT_TRANSLATION_METADATA,
];

async function resolveLink(link: Record<string, unknown>, locale: string) {
  const raw = await evaluateGroqExpression(
    linkDocQuery.query,
    [{ _id: MOCK_LINK_ID, _type: 'link', ...link }, ...pages],
    undefined,
    { locale, defaultLocale: EN },
  );

  return linkDocQuery.parse(raw);
}

function mockInternalLink(pageId: string) {
  return {
    linkType: LINK_TYPE.INTERNAL,
    label: mockLocalizedStrings({ [EN]: MOCK_LINK_LABEL }),
    internalReference: mockReference(pageId),
  };
}

describe('linkDocumentFragment', () => {
  it.each([
    {
      outcome: 'in the requested language',
      locale: NL,
      expected: MOCK_DUTCH_LABEL,
    },
    {
      outcome: 'in the default language when the requested one is missing',
      locale: FR,
      expected: MOCK_ENGLISH_LABEL,
    },
  ])('resolves the label $outcome', async ({ locale, expected }) => {
    const { label } = await resolveLink(
      {
        ...mockInternalLink(MOCK_CONTACT_PAGE_ID),
        label: mockLocalizedStrings({
          [EN]: MOCK_ENGLISH_LABEL,
          [NL]: MOCK_DUTCH_LABEL,
        }),
      },
      locale,
    );

    expect(label).toBe(expected);
  });

  it.each([
    {
      behaviour: "resolves an internal reference to the page's translation",
      pageId: MOCK_ABOUT_EN_PAGE_ID,
      locale: NL,
      expected: MOCK_ABOUT_NL_SLUG,
    },
    {
      behaviour: 'falls back to the default-language page with no translation',
      pageId: MOCK_CONTACT_PAGE_ID,
      locale: NL,
      expected: MOCK_CONTACT_SLUG,
    },
    {
      behaviour: 'resolves a nested landing page to its full path',
      pageId: MOCK_NESTED_PAGE_ID,
      locale: EN,
      expected: `${MOCK_PARENT_SLUG}/${MOCK_NESTED_SLUG}`,
    },
  ])('$behaviour', async ({ pageId, locale, expected }) => {
    const { internalReference } = await resolveLink(
      mockInternalLink(pageId),
      locale,
    );

    expect(internalReference).toEqual({
      _type: 'page_landing',
      slug: expected,
    });
  });

  it.each([
    { locale: NL, expected: MOCK_DUTCH_URL },
    { locale: FR, expected: MOCK_ENGLISH_URL },
  ])(
    'resolves the external url in $locale, else the default language',
    async ({ locale, expected }) => {
      const { url } = await resolveLink(
        {
          linkType: LINK_TYPE.EXTERNAL,
          label: mockLocalizedStrings({ [EN]: MOCK_LINK_LABEL }),
          url: mockLocalizedStrings({
            [EN]: MOCK_ENGLISH_URL,
            [NL]: MOCK_DUTCH_URL,
          }),
        },
        locale,
      );

      expect(url).toBe(expected);
    },
  );
});
