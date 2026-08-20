import { toPostListPaginationHref } from './to-post-list-pagination-href';

describe(toPostListPaginationHref, () => {
  it('builds a topic href from the topic slug', () => {
    const createHref = toPostListPaginationHref({
      type: 'TOPIC',
      topicSlug: 'engineering',
      isPaginated: true,
      page: 2,
      pageSize: 12,
    });

    expect(createHref(1)).toBe('/topics/engineering');
    expect(createHref(3)).toBe('/topics/engineering/page/3');
  });

  it('builds a tag href from the tag slug', () => {
    const createHref = toPostListPaginationHref({
      type: 'TAG',
      tagSlug: 'react',
      isPaginated: true,
      page: 2,
      pageSize: 12,
    });

    expect(createHref(1)).toBe('/tag/react');
    expect(createHref(3)).toBe('/tag/react/page/3');
  });

  it('builds a blog index href', () => {
    const createHref = toPostListPaginationHref({
      type: 'BLOG',
      isPaginated: true,
      page: 2,
      pageSize: 12,
    });

    expect(createHref(1)).toBe('/blog');
    expect(createHref(3)).toBe('/blog/page/3');
  });

  it('throws for a paginated HOME context — no paginated route exists for it', () => {
    expect(() =>
      toPostListPaginationHref({
        type: 'HOME',
        isPaginated: true,
        page: 2,
        pageSize: 12,
      }),
    ).toThrow(/HOME/);
  });

  it('throws for a paginated GENERIC context — no paginated route exists for it', () => {
    expect(() =>
      toPostListPaginationHref({
        type: 'GENERIC',
        isPaginated: true,
        page: 2,
        pageSize: 12,
      }),
    ).toThrow(/GENERIC/);
  });
});
