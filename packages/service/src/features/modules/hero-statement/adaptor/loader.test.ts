import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawHeroStatementModule } from '@blog/service/testing/modules/fixtures';
import { makeRawHeadingBlock } from '@blog/service/testing/shared/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getHeroStatement } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe(getHeroStatement, () => {
  it('resolves the hero in a single round trip — exactly one runQuery call', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawHeroStatementModule({
        headingBlock: makeRawHeadingBlock('Ship confidently'),
      }),
    );

    const hero = await getHeroStatement('hero-statement-1', tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(hero.heading).toBe('Ship confidently');
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getHeroStatement('missing', tenant)).rejects.toThrow();
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('threads tenant context and scopes cache tags to it', async () => {
    mockRun.mockResolvedValueOnce(makeRawHeroStatementModule());

    await getHeroStatement('hero-statement-1', tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:modules:heroStatement',
            't:tenant-a:module:hero-statement-1',
            't:tenant-a:page_landing',
            't:tenant-a:page_blog',
            't:tenant-a:page_post',
            't:tenant-a:topic',
          ],
        }),
      }),
    );
  });
});
