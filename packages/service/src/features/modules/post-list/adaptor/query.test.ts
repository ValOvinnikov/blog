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

const moduleDocument = mockModuleDocument({
  _type: 'module_postList',
  pageSize: MOCK_POST_LIST_PAGE_SIZE,
});

async function runPostList(locale: string) {
  const raw = await evaluateGroqExpression(
    postListModuleQuery.query,
    [moduleDocument],
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

  it('picks the heading in the visitor language', async () => {
    const { headingBlock } = await runPostList(NL);

    expect(headingBlock.heading).toBe(MOCK_DUTCH_MODULE_HEADING);
  });

  it('falls back to the default language for the heading', async () => {
    const { headingBlock } = await runPostList(FR);

    expect(headingBlock.heading).toBe(MOCK_ENGLISH_MODULE_HEADING);
  });
});
