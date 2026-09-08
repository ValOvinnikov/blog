import { postFeaturedModuleQuery } from './query';

describe('postFeaturedModuleQuery', () => {
  it('filters to module_postFeatured documents by id', () => {
    expect(postFeaturedModuleQuery.query).toContain(
      '_type == "module_postFeatured"',
    );
    expect(postFeaturedModuleQuery.query).toContain('_id == $id');
  });

  it('derefs pinned posts and drops unpublished ones, preserving authored order', () => {
    expect(postFeaturedModuleQuery.query).toContain('postSource == "PINNED"');
    expect(postFeaturedModuleQuery.query).toContain('posts[]->');
    expect(postFeaturedModuleQuery.query).toContain('publishedAt <= now()');
  });

  it('falls back to the newest featured, published posts capped at 3', () => {
    expect(postFeaturedModuleQuery.query).toContain(
      '_type == "blog_post"][featured == true][publishedAt <= now()',
    );
    expect(postFeaturedModuleQuery.query).toContain(
      'order(publishedAt desc)[0...3]',
    );
  });

  it('projects postSource and limit', () => {
    expect(postFeaturedModuleQuery.query).toContain('postSource');
    expect(postFeaturedModuleQuery.query).toContain('limit');
  });

  it('coalesces showImages to true for documents authored before the field existed', () => {
    expect(postFeaturedModuleQuery.query).toContain(
      'coalesce(showImages, true)',
    );
  });
});
