import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
  POST_SOURCE,
} from '@blog/config/constants';
import { mockRawPostFeaturedModule } from '@blog/service/testing/modules/fixtures';
import { mockRawPostCard } from '@blog/service/testing/pages/fixtures';
import { mockRawWideLayout } from '@blog/service/testing/shared/fixtures';

import { toPostFeaturedModule } from './transformer';

const threePosts = ['a', 'b', 'c'].map((_id) => ({
  post: mockRawPostCard({ _id }),
}));

describe(toPostFeaturedModule, () => {
  it('maps headingBlock straight through', () => {
    const raw = mockRawPostFeaturedModule();

    const module = toPostFeaturedModule(raw);

    expect(module.headingBlock).toEqual({
      heading: 'Featured',
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
    const module = toPostFeaturedModule(mockRawPostFeaturedModule(authored));

    expect(module).toMatchObject(authored);
  });

  it.each([
    [{ contentAlignment: null }, { contentAlignment: undefined }],
    [{ layout: null }, { layout: undefined }],
  ])('maps an unset %o to %o', (unset, expected) => {
    const module = toPostFeaturedModule(mockRawPostFeaturedModule(unset));

    expect(module).toMatchObject(expected);
  });

  it('maps a fully-authored layout object 1:1', () => {
    const layout = mockRawWideLayout();
    const raw = mockRawPostFeaturedModule({ layout });

    const module = toPostFeaturedModule(raw);

    expect(module.layout).toEqual(layout);
  });

  it('preserves authored order for pinned posts, the first being the lead', () => {
    const raw = mockRawPostFeaturedModule({
      postSource: POST_SOURCE.PINNED,
      posts: [
        {
          post: mockRawPostCard({
            _id: 'b',
            publishedAt: '2026-01-01T00:00:00Z',
          }),
        },
        {
          post: mockRawPostCard({
            _id: 'a',
            publishedAt: '2026-02-01T00:00:00Z',
          }),
        },
      ],
    });

    const module = toPostFeaturedModule(raw);

    expect(module.posts.map((p) => p.id)).toEqual(['b', 'a']);
  });

  it('drops a pin whose post did not resolve', () => {
    const raw = mockRawPostFeaturedModule({
      postSource: POST_SOURCE.PINNED,
      posts: [
        { post: mockRawPostCard({ _id: 'a' }) },
        { post: null },
        { post: mockRawPostCard({ _id: 'c' }) },
      ],
    });

    const module = toPostFeaturedModule(raw);

    expect(module.posts.map((p) => p.id)).toEqual(['a', 'c']);
  });

  it('does not cut pinned posts by a lingering limit value', () => {
    const raw = mockRawPostFeaturedModule({
      postSource: POST_SOURCE.PINNED,
      limit: 1,
      posts: threePosts,
    });

    const module = toPostFeaturedModule(raw);

    expect(module.posts.map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });

  it.each([
    [1, ['a']],
    [3, ['a', 'b', 'c']],
  ])('cuts the newest-featured source to a limit of %i', (limit, expected) => {
    const raw = mockRawPostFeaturedModule({
      postSource: POST_SOURCE.NEWEST_FEATURED,
      limit,
      posts: threePosts,
    });

    const module = toPostFeaturedModule(raw);

    expect(module.posts.map((p) => p.id)).toEqual(expected);
  });

  it('returns an empty posts array when nothing is featured in the dataset', () => {
    const raw = mockRawPostFeaturedModule({
      postSource: POST_SOURCE.NEWEST_FEATURED,
      limit: 3,
      posts: [],
    });

    const module = toPostFeaturedModule(raw);

    expect(module.posts).toEqual([]);
  });
});
