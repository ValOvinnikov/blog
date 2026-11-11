import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  MOCK_MISSING_ID,
  MOCK_POST_ID,
  MOCK_POST_SLUG,
} from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  MOCK_ABOUT_NL_PAGE_ID,
  MOCK_ABOUT_NL_SLUG,
  MOCK_TEAM_NL_PAGE_ID,
  MOCK_TEAM_SLUG,
  mockLandingPageDocument,
} from '@blog/service/testing/shared/translated-pages-dataset';

import { draftPagePathQuery } from './query';

const { EN, NL } = LOCALE_ISO_CODES;
const MOCK_HOME_ID = 'home-default';
const MOCK_ORPHAN_PAGE_ID = 'orphan-nl';

const dataset = [
  {
    _id: MOCK_POST_ID,
    _type: 'page_post',
    language: EN,
    slug: { current: MOCK_POST_SLUG },
  },
  mockLandingPageDocument(MOCK_ABOUT_NL_PAGE_ID, NL, MOCK_ABOUT_NL_SLUG),
  {
    ...mockLandingPageDocument(MOCK_TEAM_NL_PAGE_ID, NL, MOCK_TEAM_SLUG),
    parent: { _type: 'reference', _ref: MOCK_ABOUT_NL_PAGE_ID },
  },
  {
    ...mockLandingPageDocument(MOCK_ORPHAN_PAGE_ID, NL, MOCK_TEAM_SLUG),
    parent: { _type: 'reference', _ref: MOCK_MISSING_ID },
  },
  { _id: MOCK_HOME_ID, _type: 'page_home', slug: { current: MOCK_HOME_ID } },
];

function run(id: string): Promise<unknown> {
  return evaluateGroqExpression(draftPagePathQuery.query, dataset, null, {
    id,
  });
}

describe('draftPagePathQuery', () => {
  it("reads a post's slug and language", async () => {
    expect(await run(MOCK_POST_ID)).toEqual({
      _type: 'page_post',
      path: MOCK_POST_SLUG,
      language: EN,
    });
  });

  it("reads a nested landing page's full path", async () => {
    expect(await run(MOCK_TEAM_NL_PAGE_ID)).toEqual({
      _type: 'page_landing',
      path: `${MOCK_ABOUT_NL_SLUG}/${MOCK_TEAM_SLUG}`,
      language: NL,
    });
  });

  it('reads no path for a landing page whose parent is gone', async () => {
    expect(await run(MOCK_ORPHAN_PAGE_ID)).toEqual({
      _type: 'page_landing',
      path: null,
      language: NL,
    });
  });

  it.each([
    ['a page type it cannot preview', MOCK_HOME_ID],
    ['an unknown id', MOCK_MISSING_ID],
  ])('resolves nothing for %s', async (_label, id) => {
    expect(await run(id)).toBeNull();
  });

  it('rejects a document with no language', () => {
    expect(() =>
      draftPagePathQuery.parse({
        _type: 'page_post',
        path: MOCK_POST_SLUG,
        language: null,
      }),
    ).toThrow();
  });
});
