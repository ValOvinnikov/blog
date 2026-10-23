import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
} from '@blog/config/constants';
import { mockRawPostLatestModule } from '@blog/service/testing/modules/fixtures';
import { mockRawPostCard } from '@blog/service/testing/pages/fixtures';
import {
  MOCK_POST_ID,
  mockRawWideLayout,
} from '@blog/service/testing/shared/fixtures';

import {
  toPostLatestModule,
  type TRawPostLatestModulePosts,
} from './transformer';

const rawPosts: TRawPostLatestModulePosts = [];

describe(toPostLatestModule, () => {
  it('maps headingBlock straight through', () => {
    const module = toPostLatestModule(mockRawPostLatestModule(), rawPosts);

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
    { displayMode: DISPLAY_MODE.CAROUSEL },
  ])('maps an authored %o straight through', (authored) => {
    const module = toPostLatestModule(
      mockRawPostLatestModule(authored),
      rawPosts,
    );

    expect(module).toMatchObject(authored);
  });

  it.each([
    [{ contentAlignment: null }, { contentAlignment: undefined }],
    [{ layout: null }, { layout: undefined }],
  ])('maps an unset %o to %o', (unset, expected) => {
    const module = toPostLatestModule(mockRawPostLatestModule(unset), rawPosts);

    expect(module).toMatchObject(expected);
  });

  it('maps a fully-authored layout object 1:1', () => {
    const layout = mockRawWideLayout();
    const raw = mockRawPostLatestModule({ layout });

    const module = toPostLatestModule(raw, rawPosts);

    expect(module.layout).toEqual(layout);
  });

  it('maps each post to a post card', () => {
    const module = toPostLatestModule(mockRawPostLatestModule(), [
      mockRawPostCard(),
    ]);

    expect(module.posts.map((p) => p.id)).toEqual([MOCK_POST_ID]);
  });

  it('returns an empty posts array when nothing resolves', () => {
    const module = toPostLatestModule(mockRawPostLatestModule(), rawPosts);

    expect(module.posts).toEqual([]);
  });
});
