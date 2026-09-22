import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeTenant } from '@blog/service/testing/tenant';

import { getReferencingModuleIds } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe(getReferencingModuleIds, () => {
  it('returns every module id the lookup resolves', async () => {
    mockRun.mockResolvedValue(['module-a', 'module-b']);

    const result = await getReferencingModuleIds('page_post-1', tenant);

    expect(result).toEqual(['module-a', 'module-b']);
  });

  it('returns an empty list when nothing references the document', async () => {
    mockRun.mockResolvedValue([]);

    const result = await getReferencingModuleIds('page_post-1', tenant);

    expect(result).toEqual([]);
  });

  it('threads the document id and tenant context into runQuery', async () => {
    mockRun.mockResolvedValue([]);

    await getReferencingModuleIds('page_post-1', tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        parameters: { documentId: 'page_post-1' },
        tenant,
      }),
    );
  });

  it('never caches the lookup, so a purge decision cannot outlive the change that triggered it', async () => {
    mockRun.mockResolvedValue([]);

    await getReferencingModuleIds('page_post-1', tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ next: { revalidate: 0 } }),
    );
  });
});
