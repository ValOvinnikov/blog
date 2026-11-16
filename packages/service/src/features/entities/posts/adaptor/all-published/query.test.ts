import { LOCALE_ISO_CODES } from '@shinefold/config/constants';
import { mockRawFeedPost } from '@shinefold/service/testing/entities/fixtures';
import { evaluateGroqSlugs } from '@shinefold/service/testing/shared/groq';
import {
  MOCK_PUBLISHED_FEED_SLUGS,
  MOCK_TRANSLATED_POST_DOCUMENTS,
} from '@shinefold/service/testing/shared/translated-posts-dataset';

import { allPublishedPostsQuery } from './query';

const { EN, NL } = LOCALE_ISO_CODES;

function slugsIn(locale: string): Promise<string[]> {
  return evaluateGroqSlugs(
    allPublishedPostsQuery.query,
    MOCK_TRANSLATED_POST_DOCUMENTS,
    { locale, defaultLocale: EN },
  );
}

describe('allPublishedPostsQuery', () => {
  it('parses a feed post', () => {
    const raw = [mockRawFeedPost()];

    expect(() => allPublishedPostsQuery.parse(raw)).not.toThrow();
  });

  it.each([EN, NL])(
    'lists only the published %s posts, newest first',
    async (locale) => {
      const slugs = await slugsIn(locale);

      expect(slugs).toEqual(MOCK_PUBLISHED_FEED_SLUGS[locale]);
    },
  );
});
