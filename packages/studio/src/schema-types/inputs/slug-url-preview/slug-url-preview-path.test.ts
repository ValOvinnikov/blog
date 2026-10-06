import {
  buildNestedRoutePrefix,
  buildSlugUrlPreviewPath,
} from '@blog/studio/schema-types/inputs/slug-url-preview/slug-url-preview-path';

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

describe('buildNestedRoutePrefix', () => {
  it('is the root for a top-level page', () => {
    expect(buildNestedRoutePrefix([])).toBe('/');
  });

  it('joins ancestor slugs from the top of the tree down', () => {
    expect(buildNestedRoutePrefix(['faq', 'modules'])).toBe('/modules/faq/');
  });
});
