import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  MOCK_TAG_ID,
  mockRawFeedPost,
} from '@blog/service/testing/entities/fixtures';
import { evaluateGroqSlugs } from '@blog/service/testing/shared/groq';
import {
  MOCK_PUBLISHED_FEED_SLUGS,
  MOCK_TRANSLATED_POST_DOCUMENTS,
} from '@blog/service/testing/shared/translated-posts-dataset';
import { faker } from '@faker-js/faker';

import { tagScopedPublishedPostsQuery } from './query';

const { EN, NL } = LOCALE_ISO_CODES;

faker.seed(6107);

const MOCK_UNREFERENCED_TAG_ID = faker.string.uuid();

function slugsIn(locale: string, tagId = MOCK_TAG_ID): Promise<string[]> {
  return evaluateGroqSlugs(
    tagScopedPublishedPostsQuery.query,
    MOCK_TRANSLATED_POST_DOCUMENTS,
    { tagId, locale, defaultLocale: EN },
  );
}

describe('tagScopedPublishedPostsQuery', () => {
  it('parses a feed post', () => {
    const raw = [mockRawFeedPost()];

    expect(() => tagScopedPublishedPostsQuery.parse(raw)).not.toThrow();
  });

  it.each([EN, NL])(
    'lists only the published %s posts, newest first',
    async (locale) => {
      const slugs = await slugsIn(locale);

      expect(slugs).toEqual(MOCK_PUBLISHED_FEED_SLUGS[locale]);
    },
  );

  it('lists no posts for a tag none of them reference', async () => {
    const slugs = await slugsIn(EN, MOCK_UNREFERENCED_TAG_ID);

    expect(slugs).toEqual([]);
  });
});
