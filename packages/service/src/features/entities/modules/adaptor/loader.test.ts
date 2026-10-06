import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeTenant } from '@blog/service/testing/tenant';

import { getReferencingModuleIds } from './loader';

vi.mock('@blog/service/sanity/query/query', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@blog/service/sanity/query/query')
  >()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe(getReferencingModuleIds, () => {
  it('returns every module id the lookup resolves', async () => {
    mockRun.mockResolvedValueOnce(['link-a']);
    mockRun.mockResolvedValueOnce(['module-a', 'module-b']);

    const result = await getReferencingModuleIds('page_post-1', tenant);

    expect(result).toEqual(['module-a', 'module-b']);
  });

  it('returns an empty list when nothing references the document', async () => {
    mockRun.mockResolvedValueOnce([]);
    mockRun.mockResolvedValueOnce([]);

    const result = await getReferencingModuleIds('page_post-1', tenant);

    expect(result).toEqual([]);
  });

  it('looks up the links first, then passes their ids to the module lookup', async () => {
    mockRun.mockResolvedValueOnce(['link-a', 'link-b']);
    mockRun.mockResolvedValueOnce([]);

    await getReferencingModuleIds('page_post-1', tenant);

    expect(mockRun.mock.calls.map(([, options]) => options.parameters)).toEqual(
      [
        { documentId: 'page_post-1' },
        { documentId: 'page_post-1', linkIds: ['link-a', 'link-b'] },
      ],
    );
  });

  it('threads the tenant context into both lookups', async () => {
    mockRun.mockResolvedValueOnce([]);
    mockRun.mockResolvedValueOnce([]);

    await getReferencingModuleIds('page_post-1', tenant);

    expect(mockRun.mock.calls.map(([, options]) => options.tenant)).toEqual([
      tenant,
      tenant,
    ]);
  });

  it('never caches either lookup, so a purge decision cannot outlive the change that triggered it', async () => {
    mockRun.mockResolvedValueOnce([]);
    mockRun.mockResolvedValueOnce([]);

    await getReferencingModuleIds('page_post-1', tenant);

    expect(mockRun.mock.calls.map(([, options]) => options.next)).toEqual([
      { revalidate: 0 },
      { revalidate: 0 },
    ]);
  });
});
