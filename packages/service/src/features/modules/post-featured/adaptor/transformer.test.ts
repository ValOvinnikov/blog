import {
  BRAND_VARIANT,
  CARD_STYLE,
  CONTENT_ALIGNMENT,
  DENSITY,
  DISPLAY_MODE,
  POST_SOURCE,
  RADIUS_SCALE,
} from '@blog/config/constants';
import { mockRawPostFeaturedModule } from '@blog/service/testing/modules/post-featured/fixtures';
import { mockRawPostCard } from '@blog/service/testing/pages/fixtures';
import {
  mockRawHeadingBlock,
  mockRawWideLayout,
} from '@blog/service/testing/shared/fixtures';
import { faker } from '@faker-js/faker';

import { toPostFeaturedModule } from './transformer';

faker.seed(6014);

const MOCK_FIRST_ID = faker.string.uuid();
const MOCK_SECOND_ID = faker.string.uuid();
const MOCK_THIRD_ID = faker.string.uuid();
const MOCK_POST_IDS = [MOCK_FIRST_ID, MOCK_SECOND_ID, MOCK_THIRD_ID];
const MOCK_HEADING = faker.lorem.words(3);
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();
const MOCK_THREE_POSTS = MOCK_POST_IDS.map((_id) => ({
  post: mockRawPostCard({ _id }),
}));

describe(toPostFeaturedModule, () => {
  it('maps headingBlock straight through', () => {
    const raw = mockRawPostFeaturedModule({
      headingBlock: mockRawHeadingBlock(MOCK_HEADING, {
        supportingText: MOCK_SUPPORTING_TEXT,
      }),
    });

    const module = toPostFeaturedModule(raw);

    expect(module.headingBlock).toEqual({
      heading: MOCK_HEADING,
      supportingText: MOCK_SUPPORTING_TEXT,
    });
  });

  it.each([
    { brandVariant: BRAND_VARIANT.SECONDARY },
    { contentAlignment: CONTENT_ALIGNMENT.CENTER },
    { showImages: true },
    { showImages: false },
    { displayMode: DISPLAY_MODE.CAROUSEL },
    {
      cardStyle: CARD_STYLE.FILLED,
      radiusScale: RADIUS_SCALE.LG,
      density: DENSITY.COMPACT,
    },
  ])('maps an authored %o straight through', (authored) => {
    const module = toPostFeaturedModule(mockRawPostFeaturedModule(authored));

    expect(module).toMatchObject(authored);
  });

  it.each([
    [{ contentAlignment: null }, { contentAlignment: undefined }],
    [{ layout: null }, { layout: undefined }],
    [
      { cardStyle: null, radiusScale: null, density: null },
      { cardStyle: undefined, radiusScale: undefined, density: undefined },
    ],
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
            _id: MOCK_SECOND_ID,
            publishedAt: '2026-01-01T00:00:00Z',
          }),
        },
        {
          post: mockRawPostCard({
            _id: MOCK_FIRST_ID,
            publishedAt: '2026-02-01T00:00:00Z',
          }),
        },
      ],
    });

    const module = toPostFeaturedModule(raw);

    expect(module.posts.map((post) => post.id)).toEqual([
      MOCK_SECOND_ID,
      MOCK_FIRST_ID,
    ]);
  });

  it('drops a pin whose post did not resolve', () => {
    const raw = mockRawPostFeaturedModule({
      postSource: POST_SOURCE.PINNED,
      posts: [
        { post: mockRawPostCard({ _id: MOCK_FIRST_ID }) },
        { post: null },
        { post: mockRawPostCard({ _id: MOCK_THIRD_ID }) },
      ],
    });

    const module = toPostFeaturedModule(raw);

    expect(module.posts.map((post) => post.id)).toEqual([
      MOCK_FIRST_ID,
      MOCK_THIRD_ID,
    ]);
  });

  it('does not cut pinned posts by a lingering limit value', () => {
    const raw = mockRawPostFeaturedModule({
      postSource: POST_SOURCE.PINNED,
      limit: 1,
      posts: MOCK_THREE_POSTS,
    });

    const module = toPostFeaturedModule(raw);

    expect(module.posts.map((post) => post.id)).toEqual(MOCK_POST_IDS);
  });

  it.each([
    [1, [MOCK_FIRST_ID]],
    [3, MOCK_POST_IDS],
  ])('cuts the newest-featured source to a limit of %i', (limit, expected) => {
    const raw = mockRawPostFeaturedModule({
      postSource: POST_SOURCE.NEWEST_FEATURED,
      limit,
      posts: MOCK_THREE_POSTS,
    });

    const module = toPostFeaturedModule(raw);

    expect(module.posts.map((post) => post.id)).toEqual(expected);
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
