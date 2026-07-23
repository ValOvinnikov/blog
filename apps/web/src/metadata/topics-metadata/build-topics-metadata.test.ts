import { buildTopicsMetadata } from './build-topics-metadata';

describe(buildTopicsMetadata, () => {
  it('builds static metadata self-canonical to /topics', () => {
    const metadata = buildTopicsMetadata();

    expect(metadata.title).toBe('Topics');
    expect(metadata.description).toBe('Browse every post by topic.');
    expect(metadata.alternates?.canonical).toBe('/topics');
    expect(metadata.openGraph?.title).toBe('Topics');
    expect(metadata.openGraph?.description).toBe('Browse every post by topic.');
  });
});
