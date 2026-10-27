import { SANITY_PROJECT_ARCHIVE_OUTCOME } from '@blog/config';
import {
  MOCK_DEPROVISION_DRY_RUN_ENV,
  MOCK_DEPROVISION_ENV,
} from '@blog/db/testing/deprovision-tenant/fixtures';
import { MOCK_STEP_ERROR, mockTenant } from '@blog/db/testing/tenants/fixtures';
import { archiveSanityProject } from '@blog/db/utils/sanity-management-client/sanity-project-lifecycle';
import { toOutcome } from '@blog/utils/to-outcome';
import { faker } from '@faker-js/faker';

import { archiveTenantSanityProject } from './archive-sanity-project';

vi.mock('@blog/db/utils/sanity-management-client/sanity-project-lifecycle');

faker.seed(5765);

const MOCK_TENANT = mockTenant();

describe(archiveTenantSanityProject, () => {
  it('archives the Sanity project when one is set', async () => {
    await archiveTenantSanityProject(MOCK_TENANT, MOCK_DEPROVISION_ENV);

    expect(archiveSanityProject).toHaveBeenCalledWith({
      token: MOCK_DEPROVISION_ENV.sanityManagementToken,
      projectId: MOCK_TENANT.sanityProjectId,
    });
  });

  it('skips when no Sanity project id is set', async () => {
    await archiveTenantSanityProject(
      { ...MOCK_TENANT, sanityProjectId: null },
      MOCK_DEPROVISION_ENV,
    );

    expect(archiveSanityProject).not.toHaveBeenCalled();
  });

  it('does not call the API in dry-run mode', async () => {
    await archiveTenantSanityProject(MOCK_TENANT, MOCK_DEPROVISION_DRY_RUN_ENV);

    expect(archiveSanityProject).not.toHaveBeenCalled();
  });

  it('resolves when the project is already archived', async () => {
    vi.mocked(archiveSanityProject).mockResolvedValueOnce(
      toOutcome(SANITY_PROJECT_ARCHIVE_OUTCOME.ALREADY_ARCHIVED),
    );

    await expect(
      archiveTenantSanityProject(MOCK_TENANT, MOCK_DEPROVISION_ENV),
    ).resolves.toBeUndefined();
  });

  it('throws on a genuine archiving failure', async () => {
    vi.mocked(archiveSanityProject).mockRejectedValueOnce(
      new Error(MOCK_STEP_ERROR),
    );

    await expect(
      archiveTenantSanityProject(MOCK_TENANT, MOCK_DEPROVISION_ENV),
    ).rejects.toThrow(MOCK_STEP_ERROR);
  });
});
