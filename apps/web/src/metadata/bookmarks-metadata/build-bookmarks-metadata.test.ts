import { routes, SITE_MESSAGES_BY_LOCALE } from '@blog/config';
import { NOINDEX_ROBOTS } from '@web/testing/metadata/to-metadata/fixtures';

import { buildBookmarksMetadata } from './build-bookmarks-metadata';

const { title, metaDescription } = SITE_MESSAGES_BY_LOCALE.EN.bookmarksPage;

describe(buildBookmarksMetadata, () => {
  it('builds noindex metadata self-canonical to the bookmarks page', async () => {
    const metadata = await buildBookmarksMetadata();

    expect(metadata).toEqual({
      title,
      description: metaDescription,
      alternates: { canonical: routes.bookmarks() },
      robots: NOINDEX_ROBOTS,
    });
  });
});
