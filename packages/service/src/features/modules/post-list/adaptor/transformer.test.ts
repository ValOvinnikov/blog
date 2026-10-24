import { BRAND_VARIANT, CONTENT_ALIGNMENT } from '@blog/config/constants';
import { mockRawPostListModule } from '@blog/service/testing/modules/fixtures';
import { mockRawPostCard } from '@blog/service/testing/pages/fixtures';
import {
  MOCK_POST_ID,
  mockRawWideLayout,
} from '@blog/service/testing/shared/fixtures';

import { toPostListModule, type TRawPostListModulePosts } from './transformer';

const rawPosts: TRawPostListModulePosts = [];
const pagination = { currentPage: 1, totalPages: 1 };

describe(toPostListModule, () => {
  it('maps headingBlock straight through', () => {
    const module = toPostListModule(
      mockRawPostListModule(),
      rawPosts,
      pagination,
    );

    expect(module.headingBlock).toEqual({
      heading: 'Latest',
      supportingText: undefined,
    });
  });

  it.each([
    { brandVariant: BRAND_VARIANT.SECONDARY },
    { contentAlignment: CONTENT_ALIGNMENT.CENTER },
    { showImages: true },
    { showImages: false },
  ])('maps an authored %o straight through', (authored) => {
    const module = toPostListModule(
      mockRawPostListModule(authored),
      rawPosts,
      pagination,
    );

    expect(module).toMatchObject(authored);
  });

  it.each([
    [{ contentAlignment: null }, { contentAlignment: undefined }],
    [{ layout: null }, { layout: undefined }],
  ])('maps an unset %o to %o', (unset, expected) => {
    const module = toPostListModule(
      mockRawPostListModule(unset),
      rawPosts,
      pagination,
    );

    expect(module).toMatchObject(expected);
  });

  it('maps a fully-authored layout object 1:1', () => {
    const layout = mockRawWideLayout();
    const raw = mockRawPostListModule({ layout });

    const module = toPostListModule(raw, rawPosts, pagination);

    expect(module.layout).toEqual(layout);
  });

  it('maps each post to a post card', () => {
    const module = toPostListModule(
      mockRawPostListModule(),
      [mockRawPostCard()],
      pagination,
    );

    expect(module.posts.map((p) => p.id)).toEqual([MOCK_POST_ID]);
  });

  it('maps currentPage and totalPages straight through', () => {
    const module = toPostListModule(mockRawPostListModule(), rawPosts, {
      currentPage: 2,
      totalPages: 5,
    });

    expect(module.currentPage).toBe(2);
    expect(module.totalPages).toBe(5);
  });
});
