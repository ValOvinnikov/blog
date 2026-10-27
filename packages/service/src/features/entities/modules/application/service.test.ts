import { getReferencingModuleIds } from '@blog/service/features/entities/modules/adaptor/loader';
import { MOCK_DOCUMENT_ID } from '@blog/service/testing/entities/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { createModulesService } from './service';

vi.mock('@blog/service/features/entities/modules/adaptor/loader', () => ({
  getReferencingModuleIds: vi.fn(),
}));

faker.seed(6103);

const MOCK_FAILURE_MESSAGE = faker.lorem.sentence();

const tenant = mockTenant();

describe(createModulesService, () => {
  it('threads the document id and tenant context through to the loader', async () => {
    vi.mocked(getReferencingModuleIds).mockResolvedValue([]);

    await createModulesService().v1.getReferencingModuleIds(
      MOCK_DOCUMENT_ID,
      tenant,
    );

    expect(getReferencingModuleIds).toHaveBeenCalledWith(
      MOCK_DOCUMENT_ID,
      tenant,
    );
  });

  it('returns a failed result when the lookup rejects', async () => {
    vi.mocked(getReferencingModuleIds).mockRejectedValue(
      new Error(MOCK_FAILURE_MESSAGE),
    );

    const result = await createModulesService().v1.getReferencingModuleIds(
      MOCK_DOCUMENT_ID,
      tenant,
    );

    expect(result.ok).toBe(false);
  });
});
