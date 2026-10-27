import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
} from '@blog/config/constants';
import {
  MOCK_RECENT_POSTS_HEADING,
  mockRawPostLatestModule,
} from '@blog/service/testing/modules/fixtures';
import { mockRawPostCard } from '@blog/service/testing/pages/fixtures';
import {
  MOCK_POST_ID,
  mockRawHeadingBlock,
  mockRawWideLayout,
} from '@blog/service/testing/shared/fixtures';

import {
  toPostLatestModule,
  type TRawPostLatestModulePosts,
} from './transformer';

const MOCK_NO_POSTS: TRawPostLatestModulePosts = [];

describe(toPostLatestModule, () => {
  it('maps the heading block', () => {
    const raw = mockRawPostLatestModule({
      headingBlock: mockRawHeadingBlock(MOCK_RECENT_POSTS_HEADING),
    });

    const module = toPostLatestModule(raw, MOCK_NO_POSTS);

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
    { displayMode: DISPLAY_MODE.CAROUSEL },
  ])('keeps an authored %o', (authored) => {
    const module = toPostLatestModule(
      mockRawPostLatestModule(authored),
      MOCK_NO_POSTS,
    );

    expect(module).toMatchObject(authored);
  });

  it.each([
    [{ contentAlignment: null }, { contentAlignment: undefined }],
    [{ layout: null }, { layout: undefined }],
  ])('maps an unset %o to %o', (unset, expected) => {
    const module = toPostLatestModule(
      mockRawPostLatestModule(unset),
      MOCK_NO_POSTS,
    );

    expect(module).toMatchObject(expected);
  });

  it('keeps a fully-authored layout', () => {
    const layout = mockRawWideLayout();
    const raw = mockRawPostLatestModule({ layout });

    const module = toPostLatestModule(raw, MOCK_NO_POSTS);

    expect(module.layout).toEqual(layout);
  });

  it('maps each post to a post card', () => {
    const module = toPostLatestModule(mockRawPostLatestModule(), [
      mockRawPostCard(),
    ]);

    expect(module.posts.map(({ id }) => id)).toEqual([MOCK_POST_ID]);
  });

  it('returns an empty posts array when nothing resolves', () => {
    const module = toPostLatestModule(mockRawPostLatestModule(), MOCK_NO_POSTS);

    expect(module.posts).toEqual([]);
  });
});
