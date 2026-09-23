import {
  archivePageSlugParser,
  buildArchivePageSlugExpression,
} from './archive-page-slug';

describe(buildArchivePageSlugExpression, () => {
  it('resolves the slug of the archive page referencing the enclosing term', () => {
    const expression = buildArchivePageSlugExpression('page_topic', 'topic');

    expect(expression).toContain('_type == "page_topic"');
    expect(expression).toContain('topic._ref == ^._id');
    expect(expression).toContain('.slug.current');
  });

  it('falls back to the term document own slug when no archive page references it', () => {
    const expression = buildArchivePageSlugExpression('page_tag', 'tag');

    expect(expression).toBe(
      'coalesce(*[_type == "page_tag" && tag._ref == ^._id][0].slug.current, slug.current)',
    );
  });

  it('parses to a string', () => {
    expect(archivePageSlugParser.parse('engineering')).toBe('engineering');
  });
});
