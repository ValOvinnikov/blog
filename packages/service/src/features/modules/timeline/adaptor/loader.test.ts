import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawTimelineModule } from '@blog/service/testing/modules/fixtures';
import { makeRawHeadingBlock } from '@blog/service/testing/shared/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getTimelineModule } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe(getTimelineModule, () => {
  it('resolves the module in a single round trip — exactly one runQuery call', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawTimelineModule({
        headingBlock: makeRawHeadingBlock('How it works'),
      }),
    );

    const timeline = await getTimelineModule('timeline-1', tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(timeline.headingBlock.heading).toBe('How it works');
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getTimelineModule('missing', tenant)).rejects.toThrow();
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('threads tenant context and scopes cache tags to it', async () => {
    mockRun.mockResolvedValueOnce(makeRawTimelineModule());

    await getTimelineModule('timeline-1', tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:modules:timeline',
            't:tenant-a:module:timeline-1',
            't:tenant-a:link',
            't:tenant-a:homePage',
            't:tenant-a:page_landing',
          ],
        }),
      }),
    );
  });
});
