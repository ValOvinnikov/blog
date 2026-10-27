import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  MOCK_DUTCH_MODULE_HEADING,
  MOCK_ENGLISH_MODULE_HEADING,
  MOCK_MODULE_ID,
  MOCK_POST_LIST_PAGE_SIZE,
  mockModuleDocument,
  mockRawPostListModule,
} from '@blog/service/testing/modules/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { postListModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const MOCK_MODULE_DOCUMENT = mockModuleDocument({
  _type: 'module_postList',
  pageSize: MOCK_POST_LIST_PAGE_SIZE,
});

async function runPostList(locale: string) {
  const raw = await evaluateGroqExpression(
    postListModuleQuery.query,
    [MOCK_MODULE_DOCUMENT],
    undefined,
    { id: MOCK_MODULE_ID, locale, defaultLocale: EN },
  );

  return postListModuleQuery.parse(raw);
}

describe('postListModuleQuery', () => {
  it('rejects a module with no headingBlock', () => {
    const raw = { ...mockRawPostListModule(), headingBlock: null };

    expect(() => postListModuleQuery.parse(raw)).toThrow();
  });

  describe('in English', () => {
    let postList: Awaited<ReturnType<typeof runPostList>>;

    beforeEach(async () => {
      postList = await runPostList(EN);
    });

    it('reads the archive pageSize', () => {
      expect(postList.pageSize).toBe(MOCK_POST_LIST_PAGE_SIZE);
    });

    it('defaults showImages to true for a document authored without it', () => {
      expect(postList.showImages).toBe(true);
    });
  });

  it.each([
    [NL, MOCK_DUTCH_MODULE_HEADING],
    [FR, MOCK_ENGLISH_MODULE_HEADING],
  ])('resolves the heading text for a %s visitor', async (locale, expected) => {
    const { headingBlock } = await runPostList(locale);

    expect(headingBlock.heading).toBe(expected);
  });
});
