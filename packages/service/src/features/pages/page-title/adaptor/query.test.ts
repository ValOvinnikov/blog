import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { pageTitleQuery } from './query';

const { EN, NL } = LOCALE_ISO_CODES;
const MOCK_HOME_ID = 'home-default';
const MOCK_LANDING_ID = 'landing-contact-nl';
const MOCK_POST_ID = 'blog-post-en';
const MOCK_HOME_TITLE = 'Welcome home';
const MOCK_LANDING_TITLE = 'Neem contact op';
const MOCK_PRIVACY_ID = 'privacy-policy-nl';
const MOCK_PRIVACY_TITLE = 'Privacybeleid';
const MOCK_LEGAL_ID = 'terms-en';
const MOCK_LEGAL_TITLE = 'Terms';

const dataset = [
  { _id: MOCK_HOME_ID, _type: 'page_home', title: MOCK_HOME_TITLE },
  {
    _id: MOCK_LANDING_ID,
    _type: 'page_landing',
    language: NL,
    title: MOCK_LANDING_TITLE,
  },
  {
    _id: MOCK_PRIVACY_ID,
    _type: 'page_privacyDocument',
    language: NL,
    title: MOCK_PRIVACY_TITLE,
  },
  {
    _id: MOCK_LEGAL_ID,
    _type: 'page_legalDocument',
    language: EN,
    title: MOCK_LEGAL_TITLE,
  },
  { _id: MOCK_POST_ID, _type: 'page_post', language: EN, title: 'A post' },
];

function run(id: string, locale: string): Promise<unknown> {
  return evaluateGroqExpression(pageTitleQuery.query, dataset, null, {
    id,
    locale,
    defaultLocale: EN,
  });
}

describe('pageTitleQuery', () => {
  it("reads a landing page's title in its own language", async () => {
    expect(await run(MOCK_LANDING_ID, NL)).toEqual({
      title: MOCK_LANDING_TITLE,
    });
  });

  it.each([
    ['privacy', MOCK_PRIVACY_ID, NL, MOCK_PRIVACY_TITLE],
    ['legal', MOCK_LEGAL_ID, EN, MOCK_LEGAL_TITLE],
  ])(
    "reads a %s document page's title in its own language",
    async (_, id, locale, title) => {
      expect(await run(id, locale)).toEqual({ title });
    },
  );

  it('reads a Home with no language as the default language', async () => {
    expect(await run(MOCK_HOME_ID, EN)).toEqual({ title: MOCK_HOME_TITLE });
  });

  it('resolves nothing when the page is in another language', async () => {
    expect(await run(MOCK_LANDING_ID, EN)).toBeNull();
    expect(await run(MOCK_HOME_ID, NL)).toBeNull();
  });

  it('resolves nothing for a post', async () => {
    expect(await run(MOCK_POST_ID, EN)).toBeNull();
  });

  it('parses no matching page as null', () => {
    expect(pageTitleQuery.parse(null)).toBeNull();
  });

  it('rejects a page with no title', () => {
    expect(() => pageTitleQuery.parse({ title: null })).toThrow();
  });
});
