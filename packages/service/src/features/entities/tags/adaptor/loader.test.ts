import { makeRawTagWithPostCount } from '@blog/service/testing/entities/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';

import { getTags } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe(getTags, () => {
  it('maps every raw tag into a domain tag with its post count', async () => {
    mockRun.mockResolvedValue([
      makeRawTagWithPostCount({
        _id: 'a',
        title: 'Design',
        slug: 'design',
        postCount: 3,
      }),
      makeRawTagWithPostCount({
        _id: 'b',
        title: 'Engineering',
        slug: 'engineering',
        postCount: 0,
      }),
    ]);

    const result = await getTags();

    expect(result.map((t) => t.id)).toEqual(['a', 'b']);
    expect(result[0]?.title).toBe('Design');
    expect(result[0]?.postCount).toBe(3);
    expect(result[1]?.postCount).toBe(0);
  });

  it('returns an empty list when there are no tags', async () => {
    mockRun.mockResolvedValue([]);

    const result = await getTags();

    expect(result).toEqual([]);
  });
});
