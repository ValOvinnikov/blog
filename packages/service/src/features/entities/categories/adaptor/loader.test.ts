import { makeRawCategoryWithPostCount } from '@blog/service/testing/entities/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';

import { getCategories } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getCategories', () => {
  it('maps every raw category into a domain category with its post count', async () => {
    mockRun.mockResolvedValue([
      makeRawCategoryWithPostCount({
        _id: 'a',
        title: 'Design',
        slug: 'design',
        postCount: 3,
      }),
      makeRawCategoryWithPostCount({
        _id: 'b',
        title: 'Engineering',
        slug: 'engineering',
        postCount: 0,
      }),
    ]);

    const result = await getCategories();

    expect(result.map((c) => c.id)).toEqual(['a', 'b']);
    expect(result[0]?.title).toBe('Design');
    expect(result[0]?.postCount).toBe(3);
    expect(result[1]?.postCount).toBe(0);
  });

  it('returns an empty list when there are no categories', async () => {
    mockRun.mockResolvedValue([]);

    const result = await getCategories();

    expect(result).toEqual([]);
  });
});
