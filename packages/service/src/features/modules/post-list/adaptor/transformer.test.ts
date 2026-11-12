import {
  BRAND_VARIANT,
  CARD_STYLE,
  CONTENT_ALIGNMENT,
  GRID_COLUMNS,
} from '@blog/config/constants';
import { MOCK_RECENT_POSTS_HEADING } from '@blog/service/testing/modules/fixtures';
import { mockRawPostListModule } from '@blog/service/testing/modules/post-list/fixtures';
import { mockRawPostCard } from '@blog/service/testing/pages/fixtures';
import {
  MOCK_POST_ID,
  mockRawHeadingBlock,
  mockRawWideLayout,
} from '@blog/service/testing/shared/fixtures';

import { toPostListModule, type TRawPostListModulePosts } from './transformer';

const MOCK_NO_POSTS: TRawPostListModulePosts = [];
const MOCK_PAGINATION = { currentPage: 1, totalPages: 1 };

describe(toPostListModule, () => {
  it('maps the heading block', () => {
    const raw = mockRawPostListModule({
      headingBlock: mockRawHeadingBlock(MOCK_RECENT_POSTS_HEADING),
    });

    const module = toPostListModule(raw, MOCK_NO_POSTS, MOCK_PAGINATION);

    expect(module.headingBlock).toEqual({
      heading: MOCK_RECENT_POSTS_HEADING,
      supportingText: undefined,
    });
  });

  it.each([
    { brandVariant: BRAND_VARIANT.SECONDARY },
    { contentAlignment: CONTENT_ALIGNMENT.CENTER },
    { showImages: true },
    { showImages: false },
    { cardStyle: CARD_STYLE.FILLED, columns: GRID_COLUMNS.THREE },
  ])('keeps an authored %o', (authored) => {
    const module = toPostListModule(
      mockRawPostListModule(authored),
      MOCK_NO_POSTS,
      MOCK_PAGINATION,
    );

    expect(module).toMatchObject(authored);
  });

  it.each([
    [{ contentAlignment: null }, { contentAlignment: undefined }],
    [{ layout: null }, { layout: undefined }],
  ])('maps an unset %o to %o', (unset, expected) => {
    const module = toPostListModule(
      mockRawPostListModule(unset),
      MOCK_NO_POSTS,
      MOCK_PAGINATION,
    );

    expect(module).toMatchObject(expected);
  });

  it('keeps a fully-authored layout', () => {
    const layout = mockRawWideLayout();
    const raw = mockRawPostListModule({ layout });

    const module = toPostListModule(raw, MOCK_NO_POSTS, MOCK_PAGINATION);

    expect(module.layout).toEqual(layout);
  });

  it('maps each post to a post card', () => {
    const module = toPostListModule(
      mockRawPostListModule(),
      [mockRawPostCard()],
      MOCK_PAGINATION,
    );

    expect(module.posts.map(({ id }) => id)).toEqual([MOCK_POST_ID]);
  });

  it('carries the current page and total pages', () => {
    const pagination = { currentPage: 2, totalPages: 5 };

    const module = toPostListModule(
      mockRawPostListModule(),
      MOCK_NO_POSTS,
      pagination,
    );

    expect({
      currentPage: module.currentPage,
      totalPages: module.totalPages,
    }).toEqual(pagination);
  });
});
