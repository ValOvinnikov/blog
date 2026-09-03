import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeTenant } from '@blog/service/testing/tenant';

import { getTopicParams } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe('getTopicParams', () => {
  it('returns all slug entries', async () => {
    mockRun.mockResolvedValue([{ slug: 'engineering' }, { slug: 'design' }]);

    const params = await getTopicParams(tenant);

    expect(params).toEqual([{ slug: 'engineering' }, { slug: 'design' }]);
  });

  it('returns an empty array when there are no topic pages', async () => {
    mockRun.mockResolvedValue([]);

    const params = await getTopicParams(tenant);

    expect(params).toEqual([]);
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    mockRun.mockResolvedValue([]);

    await getTopicParams(tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({ tags: ['t:tenant-a:page_topic'] }),
      }),
    );
  });
});
