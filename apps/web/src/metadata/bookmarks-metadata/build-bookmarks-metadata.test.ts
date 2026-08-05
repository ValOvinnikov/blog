import { buildBookmarksMetadata } from './build-bookmarks-metadata';

describe(buildBookmarksMetadata, () => {
  it('builds noindex metadata self-canonical to /bookmarks', async () => {
    const metadata = await buildBookmarksMetadata();

    expect(metadata.title).toBe('My bookmarks');
    expect(metadata.description).toBe("Posts you've saved to read later.");
    expect(metadata.alternates?.canonical).toBe('/bookmarks');
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
