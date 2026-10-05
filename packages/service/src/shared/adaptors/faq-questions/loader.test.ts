import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawFaqModuleQuestions } from '@blog/service/testing/modules/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getFaqQuestions } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe(getFaqQuestions, () => {
  it('passes the ids as the query parameter and scopes cache tags to the tenant', async () => {
    mockRun.mockResolvedValueOnce([]);

    await getFaqQuestions(['faq-1', 'faq-2'], tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        parameters: { ids: ['faq-1', 'faq-2'] },
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:modules:faq',
            't:tenant-a:block_faq',
            't:tenant-a:link',
          ],
        }),
      }),
    );
  });

  it('returns the modules in the order of the given ids', async () => {
    mockRun.mockResolvedValueOnce([
      makeRawFaqModuleQuestions({ _id: 'faq-1' }),
      makeRawFaqModuleQuestions({ _id: 'faq-2' }),
    ]);

    const result = await getFaqQuestions(['faq-2', 'faq-1'], tenant);

    expect(result.map((module) => module._id)).toEqual(['faq-2', 'faq-1']);
  });
});
