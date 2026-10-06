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

  it('parses to a string', () => {
    expect(archivePageSlugParser.parse('engineering')).toBe('engineering');
  });

  it('parses a term with no archive page to null', () => {
    expect(archivePageSlugParser.parse(null)).toBeNull();
  });
});
