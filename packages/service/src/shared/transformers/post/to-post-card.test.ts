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

import { toPostCard } from './to-post-card';

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
    const result = toPostCard(mockRawPostCard({ wordCount: 600 }));

    expect(result.readingTimeMinutes).toBe(3);
  });

  it("resolves the author's profile page to its url", () => {
    const result = toPostCard(
      mockRawPostCard({
        author: {
          ...raw.author,
          profilePage: mockRawInternalLinkDocument({
            internalReference: { _type: 'page_landing', slug: 'jane-doe' },
          }),
        },
      }),
    );

    expect(result.author.profileUrl).toBe('/jane-doe');
  });

  it('maps a sparse post-card with no excerpt to undefined', () => {
    const result = toPostCard(
      mockRawPostCard({
        headingBlock: mockRawHeadingBlock(raw.headingBlock.heading),
      }),
    );

    expect(result.excerpt).toBeUndefined();
  });

  it('defaults featured to false when null', () => {
    const result = toPostCard(mockRawPostCard({ featured: null }));

    expect(result.featured).toBe(false);
  });

  it('returns an undefined heroImage when heroImage is absent', () => {
    const result = toPostCard(mockRawPostCard({ heroImage: null }));

    expect(result.heroImage).toBeUndefined();
  });
});
