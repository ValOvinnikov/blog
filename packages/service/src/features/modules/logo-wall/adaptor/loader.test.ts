import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawLogoWallModule } from '@blog/service/testing/modules/fixtures';
import { makeRawHeadingBlock } from '@blog/service/testing/shared/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getLogoWallModule } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe(getLogoWallModule, () => {
  it('resolves the module in a single round trip — exactly one runQuery call', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawLogoWallModule({
        headingBlock: makeRawHeadingBlock('Trusted by'),
      }),
    );

    const logoWall = await getLogoWallModule('logo-wall-1', tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(logoWall.headingBlock.heading).toBe('Trusted by');
  });

  it('returns the referenced logos in authored order', async () => {
    mockRun.mockResolvedValueOnce(makeRawLogoWallModule());

    const logoWall = await getLogoWallModule('logo-wall-1', tenant);

    expect(logoWall.logos.map((logo) => logo.id)).toEqual([
      'block-logo-1',
      'block-logo-2',
      'block-logo-3',
    ]);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getLogoWallModule('missing', tenant)).rejects.toThrow();
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('threads tenant context and scopes cache tags to it', async () => {
    mockRun.mockResolvedValueOnce(makeRawLogoWallModule());

    await getLogoWallModule('logo-wall-1', tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:modules:logoWall',
            't:tenant-a:module:logo-wall-1',
            't:tenant-a:block_logo',
            't:tenant-a:link',
            't:tenant-a:homePage',
            't:tenant-a:page_landing',
          ],
        }),
      }),
    );
  });
});
