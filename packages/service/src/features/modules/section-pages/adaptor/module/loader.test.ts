import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawSectionPagesModule } from '@blog/service/testing/modules/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getSectionPagesModuleDocument } from './loader';

vi.mock('@blog/service/sanity/query/query', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@blog/service/sanity/query/query')
  >()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe(getSectionPagesModuleDocument, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(makeRawSectionPagesModule());
  });

  it('resolves the module document fields', async () => {
    const module = await getSectionPagesModuleDocument(
      'section-pages-1',
      tenant,
    );

    expect(module.headingBlock?.heading).toBe('In this section');
  });

  it('scopes the module cache tags to the tenant', async () => {
    await getSectionPagesModuleDocument('section-pages-1', tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        parameters: { id: 'section-pages-1' },
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:modules:sectionPages',
            't:tenant-a:module:section-pages-1',
          ],
        }),
      }),
    );
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(
      getSectionPagesModuleDocument('missing', tenant),
    ).rejects.toThrow();
  });
});
