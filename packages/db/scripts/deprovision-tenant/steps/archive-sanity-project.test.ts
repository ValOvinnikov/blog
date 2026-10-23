import { SANITY_PROJECT_ARCHIVE_OUTCOME } from '@blog/config';
import { MOCK_DEPROVISION_ENV } from '@blog/db/testing/deprovision-tenant/fixtures';
import { mockTenant } from '@blog/db/testing/tenants/fixtures';
import { toOutcome } from '@blog/utils/to-outcome';

import { archiveTenantSanityProject } from './archive-sanity-project';

const { archiveSanityProjectMock } = vi.hoisted(() => ({
  archiveSanityProjectMock: vi.fn(),
}));

vi.mock(
  '@blog/db/utils/sanity-management-client/sanity-project-lifecycle',
  () => ({
    archiveSanityProject: archiveSanityProjectMock,
  }),
);

const MOCK_TENANT = mockTenant();
const MOCK_ARCHIVE_ERROR = 'network error';

beforeEach(() => {
  archiveSanityProjectMock
    .mockReset()
    .mockResolvedValue(toOutcome(SANITY_PROJECT_ARCHIVE_OUTCOME.ARCHIVED));
});

describe(archiveTenantSanityProject, () => {
  it('archives the Sanity project when one is set', async () => {
    await archiveTenantSanityProject(MOCK_TENANT, MOCK_DEPROVISION_ENV);

    expect(archiveSanityProjectMock).toHaveBeenCalledWith({
      token: MOCK_DEPROVISION_ENV.sanityManagementToken,
      projectId: MOCK_TENANT.sanityProjectId,
    });
  });

  it('skips when no Sanity project id is set', async () => {
    await archiveTenantSanityProject(
      { ...MOCK_TENANT, sanityProjectId: null },
      MOCK_DEPROVISION_ENV,
    );

    expect(archiveSanityProjectMock).not.toHaveBeenCalled();
  });

  it('does not call the API in dry-run mode', async () => {
    await archiveTenantSanityProject(MOCK_TENANT, {
      ...MOCK_DEPROVISION_ENV,
      dryRun: true,
    });

    expect(archiveSanityProjectMock).not.toHaveBeenCalled();
  });

  it('is a no-op when the project is already archived — the underlying idempotency check', async () => {
    archiveSanityProjectMock.mockResolvedValue(
      toOutcome(SANITY_PROJECT_ARCHIVE_OUTCOME.ALREADY_ARCHIVED),
    );

    await expect(
      archiveTenantSanityProject(MOCK_TENANT, MOCK_DEPROVISION_ENV),
    ).resolves.toBeUndefined();
    expect(archiveSanityProjectMock).toHaveBeenCalledTimes(1);
  });

  it('throws on a genuine archiving failure', async () => {
    archiveSanityProjectMock.mockRejectedValue(new Error(MOCK_ARCHIVE_ERROR));

    await expect(
      archiveTenantSanityProject(MOCK_TENANT, MOCK_DEPROVISION_ENV),
    ).rejects.toThrow(MOCK_ARCHIVE_ERROR);
  });
});
