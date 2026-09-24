import { getReferencingModuleIds } from '@blog/service/features/entities/modules/adaptor/loader';
import { makeTenant } from '@blog/service/testing/tenant';

import { createModulesService } from './service';

vi.mock('@blog/service/features/entities/modules/adaptor/loader', () => ({
  getReferencingModuleIds: vi.fn(),
}));

const tenant = makeTenant();

describe(createModulesService, () => {
  it('threads the document id and tenant context through to the loader', async () => {
    vi.mocked(getReferencingModuleIds).mockResolvedValue([]);

    await createModulesService().v1.getReferencingModuleIds(
      'page_post-1',
      tenant,
    );

    expect(getReferencingModuleIds).toHaveBeenCalledWith('page_post-1', tenant);
  });

  it('reports a failed lookup to the caller instead of throwing', async () => {
    vi.mocked(getReferencingModuleIds).mockRejectedValue(
      new Error('sanity unreachable'),
    );

    const result = await createModulesService().v1.getReferencingModuleIds(
      'page_post-1',
      tenant,
    );

    expect(result.ok).toBe(false);
  });
});
