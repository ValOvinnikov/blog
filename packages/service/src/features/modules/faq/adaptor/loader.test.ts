import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawFaqModule } from '@blog/service/testing/modules/fixtures';
import { makeRawHeadingBlock } from '@blog/service/testing/shared/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getFaqModule } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe(getFaqModule, () => {
  it('resolves the module in a single round trip — exactly one runQuery call', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawFaqModule({
        headingBlock: makeRawHeadingBlock('Frequently asked questions'),
      }),
    );

    const faq = await getFaqModule('faq-1', tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(faq.headingBlock.heading).toBe('Frequently asked questions');
  });

  it('returns the referenced questions in authored order', async () => {
    mockRun.mockResolvedValueOnce(makeRawFaqModule());

    const faq = await getFaqModule('faq-1', tenant);

    expect(faq.questions.map((question) => question.id)).toEqual([
      'block-faq-1',
      'block-faq-2',
    ]);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getFaqModule('missing', tenant)).rejects.toThrow();
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('threads tenant context and scopes cache tags to it', async () => {
    mockRun.mockResolvedValueOnce(makeRawFaqModule());

    await getFaqModule('faq-1', tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:modules:faq',
            't:tenant-a:module:faq-1',
            't:tenant-a:block_faq',
            't:tenant-a:link',
            't:tenant-a:homePage',
            't:tenant-a:page_landing',
          ],
        }),
      }),
    );
  });
});
