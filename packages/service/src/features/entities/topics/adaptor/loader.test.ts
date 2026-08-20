import { makeRawTopicWithPostCount } from '@blog/service/testing/entities/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';

import { getTopics } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getTopics', () => {
  it('maps every raw topic into a domain topic with its post count', async () => {
    mockRun.mockResolvedValue([
      makeRawTopicWithPostCount({
        _id: 'a',
        title: 'Design',
        slug: 'design',
        postCount: 3,
      }),
      makeRawTopicWithPostCount({
        _id: 'b',
        title: 'Engineering',
        slug: 'engineering',
        postCount: 0,
      }),
    ]);

    const result = await getTopics();

    expect(result.map((t) => t.id)).toEqual(['a', 'b']);
    expect(result[0]?.title).toBe('Design');
    expect(result[0]?.postCount).toBe(3);
    expect(result[1]?.postCount).toBe(0);
  });

  it('returns an empty list when there are no topics', async () => {
    mockRun.mockResolvedValue([]);

    const result = await getTopics();

    expect(result).toEqual([]);
  });
});
