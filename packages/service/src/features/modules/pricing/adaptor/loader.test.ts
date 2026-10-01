import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawPricingModule } from '@blog/service/testing/modules/fixtures';
import { makeRawHeadingBlock } from '@blog/service/testing/shared/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getPricingModule } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe(getPricingModule, () => {
  it('resolves the module in a single round trip — exactly one runQuery call', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawPricingModule({
        headingBlock: makeRawHeadingBlock('Plans and pricing'),
      }),
    );

    const pricing = await getPricingModule('pricing-1', tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(pricing.headingBlock.heading).toBe('Plans and pricing');
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getPricingModule('missing', tenant)).rejects.toThrow();
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('threads tenant context and scopes cache tags to it', async () => {
    mockRun.mockResolvedValueOnce(makeRawPricingModule());

    await getPricingModule('pricing-1', tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:modules:pricing',
            't:tenant-a:module:pricing-1',
            't:tenant-a:link',
            't:tenant-a:homePage',
            't:tenant-a:page_landing',
          ],
        }),
      }),
    );
  });
});
