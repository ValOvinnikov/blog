import {
  CARD_STYLE,
  DENSITY,
  GRID_COLUMNS,
  LOCALE_ISO_CODES,
  RADIUS_SCALE,
} from '@blog/config/constants';
import {
  MOCK_DUTCH_MODULE_HEADING,
  MOCK_ENGLISH_MODULE_HEADING,
  MOCK_MODULE_ID,
  MOCK_POST_LIST_PAGE_SIZE,
  mockModuleDocument,
} from '@blog/service/testing/modules/fixtures';
import { mockRawPostListModule } from '@blog/service/testing/modules/post-list/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { postListModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const MOCK_MODULE_DOCUMENT = mockModuleDocument({
  _type: 'module_postList',
  pageSize: MOCK_POST_LIST_PAGE_SIZE,
});

async function runPostList(locale: string, document = MOCK_MODULE_DOCUMENT) {
  const raw = await evaluateGroqExpression(
    postListModuleQuery.query,
    [document],
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

    it('reads no appearance overrides from a document authored without them', () => {
      expect(postList).toMatchObject({
        cardStyle: null,
        radiusScale: null,
        density: null,
        columns: null,
      });
    });
  });

  it('reads the authored appearance overrides', async () => {
    const appearance = {
      cardStyle: CARD_STYLE.OUTLINED,
      radiusScale: RADIUS_SCALE.NONE,
      density: DENSITY.COMPACT,
      columns: GRID_COLUMNS.TWO,
    };

    const postList = await runPostList(EN, {
      ...MOCK_MODULE_DOCUMENT,
      ...appearance,
    });

    expect(postList).toMatchObject(appearance);
  });

  it.each([
    [NL, MOCK_DUTCH_MODULE_HEADING],
    [FR, MOCK_ENGLISH_MODULE_HEADING],
  ])('resolves the heading text for a %s visitor', async (locale, expected) => {
    const { headingBlock } = await runPostList(locale);

    expect(headingBlock.heading).toBe(expected);
  });
});
