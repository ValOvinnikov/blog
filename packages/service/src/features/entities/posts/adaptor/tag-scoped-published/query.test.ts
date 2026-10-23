import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  MOCK_TAG_ID,
  mockRawFeedPost,
} from '@blog/service/testing/entities/fixtures';
import { evaluateGroqSlugs } from '@blog/service/testing/shared/groq';
import {
  MOCK_FEED_UNPROJECTED_FIELDS,
  MOCK_PUBLISHED_FEED_SLUGS,
  MOCK_TRANSLATED_POST_DOCUMENTS,
} from '@blog/service/testing/shared/translated-posts-dataset';

import { tagScopedPublishedPostsQuery } from './query';

const { EN, NL } = LOCALE_ISO_CODES;

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

  it.each(MOCK_FEED_UNPROJECTED_FIELDS)('does not project %s', (field) => {
    expect(tagScopedPublishedPostsQuery.query).not.toContain(field);
  });

  it.each([EN, NL])(
    'lists only the published %s posts, newest first',
    async (locale) => {
      expect(await slugsIn(locale)).toEqual(MOCK_PUBLISHED_FEED_SLUGS[locale]);
    },
  );

  it('lists no posts for a tag none of them reference', async () => {
    expect(await slugsIn(EN, 'tag-other')).toEqual([]);
  });
});
