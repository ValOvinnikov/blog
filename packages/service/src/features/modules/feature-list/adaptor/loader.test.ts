import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawFeatureListModule } from '@blog/service/testing/modules/fixtures';
import { makeRawHeadingBlock } from '@blog/service/testing/shared/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getFeatureList } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe(getFeatureList, () => {
  it('resolves the module in a single round trip — exactly one runQuery call', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawFeatureListModule({
        headingBlock: makeRawHeadingBlock('What we ship'),
      }),
    );

    const featureList = await getFeatureList('feature-list-1', tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(featureList.headingBlock.heading).toBe('What we ship');
  });

  it('returns the referenced cards in authored order', async () => {
    mockRun.mockResolvedValueOnce(makeRawFeatureListModule());

    const featureList = await getFeatureList('feature-list-1', tenant);

    expect(featureList.items.map((item) => item.id)).toEqual([
      'block-feature-1',
      'block-feature-2',
    ]);
  });

  it('resolves with an empty items array rather than throwing when features is unset', async () => {
    mockRun.mockResolvedValueOnce(makeRawFeatureListModule({ features: null }));

    const featureList = await getFeatureList('feature-list-1', tenant);

    expect(featureList.items).toEqual([]);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getFeatureList('missing', tenant)).rejects.toThrow();
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('threads tenant context and scopes cache tags to it', async () => {
    mockRun.mockResolvedValueOnce(makeRawFeatureListModule());

    await getFeatureList('feature-list-1', tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:modules:featureList',
            't:tenant-a:module:feature-list-1',
            't:tenant-a:block_feature',
            't:tenant-a:link',
            't:tenant-a:homePage',
            't:tenant-a:page_landing',
          ],
        }),
      }),
    );
  });
});
