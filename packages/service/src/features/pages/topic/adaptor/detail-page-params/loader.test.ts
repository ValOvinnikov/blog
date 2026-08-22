import { mockRun } from '@blog/service/testing/mock-run-query';

import { getTopicParams } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getTopicParams', () => {
  it('returns all slug entries', async () => {
    mockRun.mockResolvedValue([{ slug: 'engineering' }, { slug: 'design' }]);

    const params = await getTopicParams();

    expect(params).toEqual([{ slug: 'engineering' }, { slug: 'design' }]);
  });

  it('returns an empty array when there are no topic pages', async () => {
    mockRun.mockResolvedValue([]);

    const params = await getTopicParams();

    expect(params).toEqual([]);
  });

  it('tags the query with page_topic', async () => {
    mockRun.mockResolvedValue([]);

    await getTopicParams();

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        next: expect.objectContaining({ tags: ['page_topic'] }),
      }),
    );
  });
});
