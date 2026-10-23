import { ERROR_CODE } from '@blog/config/constants';
import {
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import {
  getTenantById,
  reactivateTenant,
  updateProvisioningStep,
} from '@blog/db/queries/tenants';
import { unarchiveSanityProject } from '@blog/db/utils/sanity-management-client/sanity-project-lifecycle';
import { errorResult, okResult } from '@blog/utils/result';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import { createTenantRevalidateWebhook } from '@worker/steps/create-revalidate-webhook';
import { createTenantSanityProject } from '@worker/steps/create-sanity-project';
import { mapTenantDomain } from '@worker/steps/map-domain';
import { persistTenantSanityToken } from '@worker/steps/persist-sanity-token';
import { MOCK_RUN_CONTEXT } from '@worker/testing/run/fixtures';
import {
  MOCK_SANITY_DATASET,
  MOCK_SANITY_PROJECT_ID,
  MOCK_TENANT_ID,
  mockProvisionedTenant,
  mockTenant,
} from '@worker/testing/tenant/fixtures';
import { FatalError, getStepMetadata } from 'workflow';

import { ensureInfrastructure } from './ensure-infrastructure';

const EXISTING_PROJECT_ID = 'proj-existing';

vi.mock(import('@blog/db/queries/tenants'), async (importOriginal) =>
  (
    await import('@worker/testing/tenants-queries/fake-tenants-queries')
  ).withFakeTenantsQueries(await importOriginal()),
);
vi.mock(
  '@blog/db/utils/sanity-management-client/sanity-project-lifecycle',
  () => ({ unarchiveSanityProject: vi.fn() }),
);
vi.mock(
  '@worker/utils/provision-env/provision-env',
  () => import('@worker/testing/provision-env/fake-provision-env'),
);
vi.mock('@worker/steps/create-revalidate-webhook');
vi.mock('@worker/steps/create-sanity-project');
vi.mock('@worker/steps/map-domain');
vi.mock('@worker/steps/persist-sanity-token');
vi.mock('workflow', async (importOriginal) => ({
  ...(await importOriginal<typeof import('workflow')>()),
  getStepMetadata: vi.fn(),
}));

function atAttempt(attempt: number): void {
  vi.mocked(getStepMetadata).mockReturnValue({
    attempt,
  } as ReturnType<typeof getStepMetadata>);
}

function runningSteps(): string[] {
  return vi
    .mocked(updateProvisioningStep)
    .mock.calls.filter(
      ([input]) => input.status === TENANT_PROVISIONING_STEP_STATUS.RUNNING,
    )
    .map(([input]) => input.step);
}

describe(ensureInfrastructure, () => {
  beforeEach(() => {
    atAttempt(1);
    vi.mocked(getTenantById).mockResolvedValue(mockTenant());
    vi.mocked(reactivateTenant).mockResolvedValue(okResult(mockTenant()));
    vi.mocked(createTenantSanityProject).mockResolvedValue({
      sanityProjectId: MOCK_SANITY_PROJECT_ID,
      sanityDataset: MOCK_SANITY_DATASET,
    });
    vi.mocked(updateProvisioningStep).mockResolvedValue(
      errorResult(ERROR_CODE.DB_NOT_FOUND),
    );
  });

  it('reports the four infrastructure steps in order and succeeds', async () => {
    const result = await ensureInfrastructure(MOCK_TENANT_ID, MOCK_RUN_CONTEXT);

    expect(result).toEqual({ ok: true, data: undefined });
    expect(runningSteps()).toEqual([
      TENANT_PROVISIONING_STEP.SANITY_PROJECT,
      TENANT_PROVISIONING_STEP.PERSIST_TOKEN,
      TENANT_PROVISIONING_STEP.CREATE_WEBHOOK,
      TENANT_PROVISIONING_STEP.MAP_DOMAIN,
    ]);
  });

  it('hands the project created for the tenant to the later steps', async () => {
    await ensureInfrastructure(MOCK_TENANT_ID, MOCK_RUN_CONTEXT);

    expect(persistTenantSanityToken).toHaveBeenCalledWith(
      expect.objectContaining({
        sanityProjectId: MOCK_SANITY_PROJECT_ID,
        sanityDataset: MOCK_SANITY_DATASET,
      }),
      expect.anything(),
    );
    expect(mapTenantDomain).toHaveBeenCalledWith(
      expect.objectContaining({ sanityProjectId: MOCK_SANITY_PROJECT_ID }),
      expect.anything(),
    );
  });

  it('does not unarchive when the tenant has no Sanity project yet', async () => {
    await ensureInfrastructure(MOCK_TENANT_ID, MOCK_RUN_CONTEXT);

    expect(unarchiveSanityProject).not.toHaveBeenCalled();
  });

  it('unarchives the existing Sanity project of a reactivated tenant', async () => {
    vi.mocked(reactivateTenant).mockResolvedValue(
      okResult(
        mockTenant({
          sanityProjectId: EXISTING_PROJECT_ID,
          sanityDataset: MOCK_SANITY_DATASET,
        }),
      ),
    );

    await ensureInfrastructure(MOCK_TENANT_ID, MOCK_RUN_CONTEXT);

    expect(unarchiveSanityProject).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: EXISTING_PROJECT_ID }),
    );
  });

  it('succeeds again on a second run against the project the first created', async () => {
    const existing = mockProvisionedTenant();
    vi.mocked(reactivateTenant).mockResolvedValue(okResult(existing));

    const first = await ensureInfrastructure(MOCK_TENANT_ID, MOCK_RUN_CONTEXT);
    const second = await ensureInfrastructure(MOCK_TENANT_ID, MOCK_RUN_CONTEXT);

    expect(first).toEqual({ ok: true, data: undefined });
    expect(second).toEqual({ ok: true, data: undefined });
    expect(createTenantSanityProject).toHaveBeenLastCalledWith(
      expect.objectContaining({ sanityProjectId: MOCK_SANITY_PROJECT_ID }),
      expect.anything(),
    );
  });

  it('stops at the first failing step on its final attempt', async () => {
    atAttempt(PROVISIONING_UNIT_MAX_RETRIES + 1);
    vi.mocked(persistTenantSanityToken).mockRejectedValue(
      new Error('token mint refused'),
    );

    const result = await ensureInfrastructure(MOCK_TENANT_ID, MOCK_RUN_CONTEXT);

    expect(result).toEqual({
      ok: false,
      error: TENANT_PROVISIONING_STEP.PERSIST_TOKEN,
    });
    expect(createTenantRevalidateWebhook).not.toHaveBeenCalled();
    expect(mapTenantDomain).not.toHaveBeenCalled();
  });

  it('rethrows a step failure while retries remain', async () => {
    const failure = new Error('vercel rate limited');
    vi.mocked(mapTenantDomain).mockRejectedValue(failure);

    await expect(
      ensureInfrastructure(MOCK_TENANT_ID, MOCK_RUN_CONTEXT),
    ).rejects.toBe(failure);

    expect(updateProvisioningStep).not.toHaveBeenCalledWith(
      expect.objectContaining({
        status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
      }),
    );
  });

  it('fails the project step when the tenant cannot be reactivated', async () => {
    vi.mocked(reactivateTenant).mockResolvedValue(
      errorResult(ERROR_CODE.DB_NOT_FOUND),
    );

    const result = await ensureInfrastructure(MOCK_TENANT_ID, MOCK_RUN_CONTEXT);

    expect(result).toEqual({
      ok: false,
      error: TENANT_PROVISIONING_STEP.SANITY_PROJECT,
    });
    expect(createTenantSanityProject).not.toHaveBeenCalled();
  });

  it('throws a fatal error and reports nothing for a missing tenant', async () => {
    vi.mocked(getTenantById).mockResolvedValue(undefined);

    await expect(
      ensureInfrastructure(MOCK_TENANT_ID, MOCK_RUN_CONTEXT),
    ).rejects.toThrow(FatalError);

    expect(updateProvisioningStep).not.toHaveBeenCalled();
  });
});
