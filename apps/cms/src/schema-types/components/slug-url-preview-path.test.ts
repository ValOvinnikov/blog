import { buildSlugUrlPreviewPath } from '@cms/schema-types/components/slug-url-preview-path';

describe('buildSlugUrlPreviewPath', () => {
  it('joins a route prefix and a slug', () => {
    expect(buildSlugUrlPreviewPath('/topics/', 'my-topic')).toBe(
      '/topics/my-topic',
    );
  });

  it('joins the root prefix directly against the slug', () => {
    expect(buildSlugUrlPreviewPath('/', 'about-us')).toBe('/about-us');
  });

  it('falls back to just the prefix when no slug is set yet', () => {
    expect(buildSlugUrlPreviewPath('/topics/', undefined)).toBe('/topics/');
  });
});
