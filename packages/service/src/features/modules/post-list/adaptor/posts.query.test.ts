import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { postListModulePaginatedPostsQuery } from './posts.query';

describe(postListModulePaginatedPostsQuery, () => {
  it('windows the first page by pageSize (end-exclusive slice)', () => {
    expect(postListModulePaginatedPostsQuery(1, 9).query).toContain('[0...9]');
  });

  it('windows a later page number by page/pageSize (end-exclusive slice)', () => {
    expect(postListModulePaginatedPostsQuery(2, 9).query).toContain('[9...18]');
    expect(postListModulePaginatedPostsQuery(3, 9).query).toContain(
      '[18...27]',
    );
  });

  it('orders by newest first', () => {
    expect(postListModulePaginatedPostsQuery(1, 9).query).toContain(
      'order(publishedAt desc)',
    );
  });

  it('excludes posts whose publishedAt is in the future', () => {
    expect(postListModulePaginatedPostsQuery(1, 9).query).toContain(
      'publishedAt <= now()',
    );
  });

  it('returns the total match count alongside the windowed posts', () => {
    expect(postListModulePaginatedPostsQuery(1, 9).query).toContain(
      '"total": count(',
    );
  });

  describe('scoping', () => {
    function post(id: string, refs: { tag?: string; topic?: string }) {
      return {
        _id: id,
        _type: 'page_post',
        publishedAt: '2020-01-01T00:00:00Z',
        tags: refs.tag ? [{ _key: id, _ref: refs.tag }] : [],
        topic: refs.topic ? { _ref: refs.topic } : undefined,
      };
    }
    const dataset = [
      post('a', { tag: 'tag-1' }),
      post('b', { tag: 'tag-1', topic: 'topic-1' }),
      post('c', { topic: 'topic-1' }),
      post('d', { tag: 'tag-2' }),
      {
        ...post('future', { tag: 'tag-1' }),
        publishedAt: '2999-01-01T00:00:00Z',
      },
    ];

    async function run(termId?: string) {
      const query = postListModulePaginatedPostsQuery(
        1,
        10,
        termId ? { termId } : undefined,
      ).query;

      return (await evaluateGroqExpression(
        query,
        dataset,
        undefined,
        termId ? { termId } : {},
      )) as { posts: { _id: string }[]; total: number };
    }

    it('returns only published posts referencing a tag, and counts only those', async () => {
      const result = await run('tag-1');

      expect(result.posts.map((p) => p._id).sort()).toEqual(['a', 'b']);
      expect(result.total).toBe(2);
    });

    it('returns only published posts referencing a topic', async () => {
      const result = await run('topic-1');

      expect(result.posts.map((p) => p._id).sort()).toEqual(['b', 'c']);
      expect(result.total).toBe(2);
    });

    it('returns every published post when unscoped', async () => {
      const result = await run();

      expect(result.posts.map((p) => p._id).sort()).toEqual([
        'a',
        'b',
        'c',
        'd',
      ]);
      expect(result.total).toBe(4);
    });
  });
});
