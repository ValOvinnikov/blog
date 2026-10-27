import { routes } from '@blog/config';
import {
  MOCK_AUTHOR_AVATAR_ALT,
  MOCK_AUTHOR_ID,
  MOCK_AUTHOR_NAME,
  MOCK_TOPIC_ID,
  MOCK_TOPIC_SLUG,
  MOCK_TOPIC_TITLE,
} from '@blog/service/testing/entities/fixtures';
import { mockRawPostCard } from '@blog/service/testing/pages/fixtures';
import {
  MOCK_POST_EXCERPT,
  MOCK_POST_ID,
  MOCK_POST_PUBLISHED_AT,
  MOCK_POST_SLUG,
  MOCK_POST_TITLE,
  mockRawHeadingBlock,
  mockRawInternalLinkDocument,
  mockSanityImageView,
} from '@blog/service/testing/shared/fixtures';
import { faker } from '@faker-js/faker';

import { toPostCard } from './to-post-card';

faker.seed(6019);

const MOCK_PROFILE_SLUG = faker.lorem.slug();

describe(toPostCard, () => {
  const raw = mockRawPostCard();

  it('maps all fields from raw input', () => {
    const result = toPostCard(raw);

    expect(result).toEqual({
      id: MOCK_POST_ID,
      title: MOCK_POST_TITLE,
      slug: MOCK_POST_SLUG,
      excerpt: MOCK_POST_EXCERPT,
      publishedAt: MOCK_POST_PUBLISHED_AT,
      heroImage: mockSanityImageView(),
      featured: false,
      author: {
        id: MOCK_AUTHOR_ID,
        name: MOCK_AUTHOR_NAME,
        image: mockSanityImageView(MOCK_AUTHOR_AVATAR_ALT),
        profileUrl: undefined,
      },
      topic: {
        id: MOCK_TOPIC_ID,
        title: MOCK_TOPIC_TITLE,
        slug: MOCK_TOPIC_SLUG,
      },
      readingTimeMinutes: 2,
    });
  });

  it('computes reading time from the word count', () => {
    const { readingTimeMinutes } = toPostCard(
      mockRawPostCard({ wordCount: 600 }),
    );

    expect(readingTimeMinutes).toBe(3);
  });

  it("resolves the author's profile page to its url", () => {
    const { author } = toPostCard(
      mockRawPostCard({
        author: {
          ...raw.author,
          profilePage: mockRawInternalLinkDocument({
            internalReference: {
              _type: 'page_landing',
              slug: MOCK_PROFILE_SLUG,
            },
          }),
        },
      }),
    );

    expect(author.profileUrl).toBe(routes.landingPage(MOCK_PROFILE_SLUG));
  });

  it('maps a post with no supporting text to an undefined excerpt', () => {
    const { excerpt } = toPostCard(
      mockRawPostCard({
        headingBlock: mockRawHeadingBlock(raw.headingBlock.heading),
      }),
    );

    expect(excerpt).toBeUndefined();
  });

  it('defaults featured to false when null', () => {
    const { featured } = toPostCard(mockRawPostCard({ featured: null }));

    expect(featured).toBe(false);
  });

  it('returns an undefined heroImage when heroImage is absent', () => {
    const { heroImage } = toPostCard(mockRawPostCard({ heroImage: null }));

    expect(heroImage).toBeUndefined();
  });
});
