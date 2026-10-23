import { LINK_TYPE } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { q } from '@blog/service/sanity/query/query';
import { mockReference } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { mockLocalizedStrings } from '@blog/service/testing/shared/localized';
import {
  MOCK_ABOUT_EN_PAGE_ID,
  MOCK_ABOUT_NL_PAGE_ID,
  MOCK_ABOUT_NL_SLUG,
  MOCK_ABOUT_SLUG,
  MOCK_ABOUT_TRANSLATION_METADATA,
} from '@blog/service/testing/shared/translated-pages-dataset';

import { linkDocumentFragment } from './link-document';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const linkDocQuery = q.star
  .filterByType('link')
  .slice(0)
  .project(linkDocumentFragment)
  .notNull();

const CONTACT_PAGE_ID = 'contact-en';
const MODULES_PAGE_ID = 'modules-en';
const ENGLISH_URL = 'https://example.com/en';
const DUTCH_URL = 'https://example.com/nl';

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
  { _id: CONTACT_PAGE_ID, _type: 'page_landing', slug: { current: 'contact' } },
  { _id: MODULES_PAGE_ID, _type: 'page_landing', slug: { current: 'modules' } },
  {
    _id: 'faq-en',
    _type: 'page_landing',
    slug: { current: 'faq' },
    parent: mockReference(MODULES_PAGE_ID),
  },
  MOCK_ABOUT_TRANSLATION_METADATA,
];

function resolveLink(link: Record<string, unknown>, locale: string) {
  return evaluateGroqExpression(
    linkDocQuery.query,
    [{ _id: 'link-1', _type: 'link', ...link }, ...pages],
    undefined,
    { locale, defaultLocale: EN },
  );
}

describe('linkDocumentFragment', () => {
  it('resolves the label in the requested language', async () => {
    const result = await resolveLink(
      {
        linkType: LINK_TYPE.INTERNAL,
        label: mockLocalizedStrings({ [EN]: 'About us', [NL]: 'Over ons' }),
        internalReference: mockReference(CONTACT_PAGE_ID),
      },
      NL,
    );

    expect(result).toMatchObject({ label: 'Over ons' });
  });

  it('falls back to the default-language label when the requested one is missing', async () => {
    const result = await resolveLink(
      {
        linkType: LINK_TYPE.INTERNAL,
        label: mockLocalizedStrings({ [EN]: 'About us' }),
        internalReference: mockReference(CONTACT_PAGE_ID),
      },
      FR,
    );

    expect(result).toMatchObject({ label: 'About us' });
  });

  it("resolves an internal reference to the page's translation in the language", async () => {
    const result = await resolveLink(
      {
        linkType: LINK_TYPE.INTERNAL,
        label: mockLocalizedStrings({ [EN]: 'About us' }),
        internalReference: mockReference(MOCK_ABOUT_EN_PAGE_ID),
      },
      NL,
    );

    expect(result).toMatchObject({
      internalReference: { _type: 'page_landing', slug: MOCK_ABOUT_NL_SLUG },
    });
  });

  it('falls back to the default-language page when the target has no translation', async () => {
    const result = await resolveLink(
      {
        linkType: LINK_TYPE.INTERNAL,
        label: mockLocalizedStrings({ [EN]: 'Contact' }),
        internalReference: mockReference(CONTACT_PAGE_ID),
      },
      NL,
    );

    expect(result).toMatchObject({
      internalReference: { _type: 'page_landing', slug: 'contact' },
    });
  });

  it('resolves a nested landing page to its full path', async () => {
    const result = await resolveLink(
      {
        linkType: LINK_TYPE.INTERNAL,
        label: mockLocalizedStrings({ [EN]: 'FAQ' }),
        internalReference: mockReference('faq-en'),
      },
      EN,
    );

    expect(result).toMatchObject({
      internalReference: { _type: 'page_landing', slug: 'modules/faq' },
    });
  });

  it('resolves an external url in the requested language, else the default', async () => {
    const link = {
      linkType: LINK_TYPE.EXTERNAL,
      label: mockLocalizedStrings({ [EN]: 'Docs' }),
      url: mockLocalizedStrings({
        [EN]: ENGLISH_URL,
        [NL]: DUTCH_URL,
      }),
    };

    const dutchLink = await resolveLink(link, NL);
    const frenchLink = await resolveLink(link, FR);

    expect(dutchLink).toMatchObject({ url: DUTCH_URL });
    expect(frenchLink).toMatchObject({ url: ENGLISH_URL });
  });
});
