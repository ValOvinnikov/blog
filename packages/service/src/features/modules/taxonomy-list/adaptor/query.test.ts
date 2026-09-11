import { makeRawTaxonomyListModule } from '@blog/service/testing/modules/fixtures';

import { taxonomyListModuleQuery } from './query';

describe('taxonomyListModuleQuery', () => {
  it('filters to module_taxonomyList documents by id', () => {
    expect(taxonomyListModuleQuery.query).toContain(
      '_type == "module_taxonomyList"',
    );
    expect(taxonomyListModuleQuery.query).toContain('_id == $id');
  });

  it('does not project an emptyMessage field', () => {
    expect(taxonomyListModuleQuery.query).not.toContain('emptyMessage');
  });

  it('parses a module with no headingBlock/layout set', () => {
    const raw = makeRawTaxonomyListModule({
      headingBlock: null,
      layout: null,
    });

    expect(() => taxonomyListModuleQuery.parse(raw)).not.toThrow();
  });

  it('projects contentAlignment', () => {
    expect(taxonomyListModuleQuery.query).toContain('contentAlignment');
  });

  it('resolves taxonomy from the authored field, falling back to $fallbackTaxonomy', () => {
    expect(taxonomyListModuleQuery.query).toContain(
      'coalesce(taxonomy, $fallbackTaxonomy)',
    );
  });

  it('defaults sortOrder to ALPHABETICAL at read time', () => {
    expect(taxonomyListModuleQuery.query).toContain(
      'coalesce(sortOrder, "ALPHABETICAL")',
    );
  });

  it('selects topic entries or tag entries by the resolved taxonomy', () => {
    expect(taxonomyListModuleQuery.query).toContain('_type == "blog_topic"');
    expect(taxonomyListModuleQuery.query).toContain('_type == "blog_tag"');
  });

  it('defaults showLatestPosts to true at read time', () => {
    expect(taxonomyListModuleQuery.query).toContain(
      'coalesce(showLatestPosts, true)',
    );
  });

  it('projects each entry post count via the shared published-post filter', () => {
    expect(taxonomyListModuleQuery.query).toContain(
      'count(*[_type == "page_post" && references(^._id) && publishedAt <= now() && defined(headingBlock.heading) && defined(author) && defined(topic) && defined(content) && defined(seo)])',
    );
  });

  it('orders latestPosts newest first, sliced to two, excluding scheduled posts', () => {
    expect(taxonomyListModuleQuery.query).toContain(
      '*[_type == "page_post"][references(^._id)][publishedAt <= now() && defined(headingBlock.heading) && defined(author) && defined(topic) && defined(content) && defined(seo)] | order(publishedAt desc)[0...2]',
    );
  });

  it('projects only the id, heading and slug for each latest post', () => {
    expect(taxonomyListModuleQuery.query).toContain('"slug": slug.current');
    expect(taxonomyListModuleQuery.query).not.toContain('wordCount');
  });
});
