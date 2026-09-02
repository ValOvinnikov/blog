import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawContentModule } from '@blog/service/testing/modules/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getContent } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe('getContent', () => {
  it('maps the content module document', async () => {
    mockRun.mockResolvedValueOnce(makeRawContentModule());

    const content = await getContent('content-1', tenant);

    expect(content.body).toHaveLength(1);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getContent('missing', tenant)).rejects.toThrow();
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    mockRun.mockResolvedValue(makeRawContentModule());

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
});
