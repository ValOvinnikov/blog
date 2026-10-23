import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { pageTitleQuery } from './query';

const { EN, NL } = LOCALE_ISO_CODES;
const HOME_ID = 'home-default';
const LANDING_ID = 'landing-contact-nl';
const POST_ID = 'blog-post-en';
const HOME_TITLE = 'Welcome home';
const LANDING_TITLE = 'Neem contact op';

const dataset = [
  { _id: HOME_ID, _type: 'page_home', title: HOME_TITLE },
  {
    _id: LANDING_ID,
    _type: 'page_landing',
    language: NL,
    title: LANDING_TITLE,
  },
  { _id: POST_ID, _type: 'page_post', language: EN, title: 'A post' },
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
    expect(await run(LANDING_ID, NL)).toEqual({ title: LANDING_TITLE });
  });

  it('reads a Home with no language as the default language', async () => {
    expect(await run(HOME_ID, EN)).toEqual({ title: HOME_TITLE });
  });

  it('resolves nothing when the page is in another language', async () => {
    expect(await run(LANDING_ID, EN)).toBeNull();
    expect(await run(HOME_ID, NL)).toBeNull();
  });

  it('resolves nothing for a document that is not a home or landing page', async () => {
    expect(await run(POST_ID, EN)).toBeNull();
  });

  it('parses no match as null rather than throwing', () => {
    expect(pageTitleQuery.parse(null)).toBeNull();
  });

  it('rejects a page with no title', () => {
    expect(() => pageTitleQuery.parse({ title: null })).toThrow();
  });
});
