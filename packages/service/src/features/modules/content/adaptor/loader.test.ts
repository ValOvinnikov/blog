import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawContentModule } from '@blog/service/testing/modules/fixtures';

import { getContent } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getContent', () => {
  it('maps the content module document', async () => {
    mockRun.mockResolvedValueOnce(makeRawContentModule());

    const content = await getContent('content-1');

    expect(content.body).toHaveLength(1);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getContent('missing')).rejects.toThrow();
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    mockRun.mockResolvedValue(makeRawContentModule());
    const tenant = {
      projectId: 'tenant-a',
      dataset: 'production',
      token: 'tok',
    };

    await getContent('content-1', tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: ['t:tenant-a:modules:content', 't:tenant-a:module:content-1'],
        }),
      }),
    );
  });

  it('omits tenant scoping when no tenant is given (legacy behavior unchanged)', async () => {
    mockRun.mockResolvedValue(makeRawContentModule());

    await getContent('content-1');

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant: undefined,
        next: expect.objectContaining({
          tags: ['modules:content', 'module:content-1'],
        }),
      }),
    );
  });
});
