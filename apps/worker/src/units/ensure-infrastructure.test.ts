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
import { faker } from '@faker-js/faker';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import { createTenantRevalidateWebhook } from '@worker/steps/create-revalidate-webhook';
import { createTenantSanityProject } from '@worker/steps/create-sanity-project';
import { mapTenantDomain } from '@worker/steps/map-domain';
import { persistTenantSanityToken } from '@worker/steps/persist-sanity-token';
import { MOCK_PROVISION_ENV } from '@worker/testing/provision-env/fake-provision-env';
import { MOCK_RUN_CONTEXT } from '@worker/testing/run/fixtures';
import {
  MOCK_SANITY_DATASET,
  MOCK_SANITY_PROJECT_ID,
  MOCK_TENANT_ID,
  mockProvisionedTenant,
  mockTenant,
} from '@worker/testing/tenant/fixtures';
import { atStepAttempt } from '@worker/testing/workflow/step-attempt';
import { FatalError } from 'workflow';

import { ensureInfrastructure } from './ensure-infrastructure';

faker.seed(7009);

const MOCK_EXISTING_PROJECT_ID = faker.string.alphanumeric(8);

vi.mock('@blog/db/queries/tenants');
vi.mock(
  '@blog/db/utils/sanity-management-client/sanity-project-lifecycle',
  () => ({ unarchiveSanityProject: vi.fn() }),
);
vi.mock('@worker/utils/provision-env/provision-env');
vi.mock('@worker/steps/create-revalidate-webhook');
vi.mock('@worker/steps/create-sanity-project');
vi.mock('@worker/steps/map-domain');
vi.mock('@worker/steps/persist-sanity-token');
vi.mock('workflow');

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
    atStepAttempt(1);
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

    const [persistedTenant, persistEnv] =
      vi.mocked(persistTenantSanityToken).mock.lastCall ?? [];
    const [mappedTenant, mapEnv] =
      vi.mocked(mapTenantDomain).mock.lastCall ?? [];
    expect(persistedTenant?.sanityProjectId).toBe(MOCK_SANITY_PROJECT_ID);
    expect(persistedTenant?.sanityDataset).toBe(MOCK_SANITY_DATASET);
    expect(mappedTenant?.sanityProjectId).toBe(MOCK_SANITY_PROJECT_ID);
    expect(persistEnv).toBe(MOCK_PROVISION_ENV);
    expect(mapEnv).toBe(MOCK_PROVISION_ENV);
  });

  it('does not unarchive when the tenant has no Sanity project yet', async () => {
    await ensureInfrastructure(MOCK_TENANT_ID, MOCK_RUN_CONTEXT);

    expect(unarchiveSanityProject).not.toHaveBeenCalled();
  });

  it('unarchives the existing Sanity project of a reactivated tenant', async () => {
    vi.mocked(reactivateTenant).mockResolvedValue(
      okResult(
        mockTenant({
          sanityProjectId: MOCK_EXISTING_PROJECT_ID,
          sanityDataset: MOCK_SANITY_DATASET,
        }),
      ),
    );

    await ensureInfrastructure(MOCK_TENANT_ID, MOCK_RUN_CONTEXT);

    expect(unarchiveSanityProject).toHaveBeenCalledWith({
      token: MOCK_PROVISION_ENV.sanityManagementToken,
      projectId: MOCK_EXISTING_PROJECT_ID,
    });
  });

  it('succeeds again on a second run against the project the first created', async () => {
    const existing = mockProvisionedTenant();
    vi.mocked(reactivateTenant).mockResolvedValue(okResult(existing));

    const first = await ensureInfrastructure(MOCK_TENANT_ID, MOCK_RUN_CONTEXT);
    const second = await ensureInfrastructure(MOCK_TENANT_ID, MOCK_RUN_CONTEXT);

    expect(first).toEqual({ ok: true, data: undefined });
    expect(second).toEqual({ ok: true, data: undefined });
    const [projectTenant] =
      vi.mocked(createTenantSanityProject).mock.lastCall ?? [];
    expect(projectTenant?.sanityProjectId).toBe(MOCK_SANITY_PROJECT_ID);
  });

  it('stops at the first failing step on its final attempt', async () => {
    atStepAttempt(PROVISIONING_UNIT_MAX_RETRIES + 1);
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

    const statuses = vi
      .mocked(updateProvisioningStep)
      .mock.calls.map(([input]) => input.status);
    expect(statuses).not.toContain(TENANT_PROVISIONING_STEP_STATUS.FAILED);
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
