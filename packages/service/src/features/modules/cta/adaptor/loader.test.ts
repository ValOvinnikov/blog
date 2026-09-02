import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  makeRawCtaAction,
  makeRawCtaModule,
} from '@blog/service/testing/modules/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getCta } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe('getCta', () => {
  it('maps the cta module document', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawCtaModule({ actions: { actions: [makeRawCtaAction()] } }),
    );

    const cta = await getCta('cta-1', tenant);

    expect(cta.sectionHeader.heading).toBe('Subscribe to the newsletter');
    expect(cta.actions?.[0]?.link.href).toBe('/newsletter');
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getCta('missing', tenant)).rejects.toThrow();
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    mockRun.mockResolvedValue(makeRawCtaModule());

    await getCta('cta-1', tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:modules:cta',
            't:tenant-a:module:cta-1',
            't:tenant-a:post',
            't:tenant-a:topic',
            't:tenant-a:page_generic',
            't:tenant-a:page_blog',
          ],
        }),
      }),
    );
  });
});
