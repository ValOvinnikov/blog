import { ERROR_CODE, LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  TENANT_PLAN,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  TENANT_STATUS,
} from '@blog/db/constants';
import {
  getTenantById,
  reactivateTenant,
  updateProvisioningStep,
} from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { unarchiveSanityProject } from '@blog/db/utils/sanity-management-client/sanity-project-lifecycle';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import {
  createTenantRevalidateWebhook,
  createTenantSanityProject,
  mapTenantDomain,
  persistTenantSanityToken,
} from '@worker/utils/db-provisioning-steps/db-provisioning-steps';
import { FatalError, getStepMetadata } from 'workflow';

import { ensureInfrastructure } from './ensure-infrastructure';

const TENANT_ID = '3f2b8c1e-5d4a-4e6f-9a7b-1c2d3e4f5a6b';
const CTX = { runId: 'run-1' };

vi.mock('@worker/utils/logger/logger');
vi.mock('@blog/db/queries/tenants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/db/queries/tenants')>()),
  getTenantById: vi.fn(),
  reactivateTenant: vi.fn(),
  updateProvisioningStep: vi.fn(),
}));
vi.mock(
  '@blog/db/utils/sanity-management-client/sanity-project-lifecycle',
  () => ({ unarchiveSanityProject: vi.fn() }),
);
vi.mock('@worker/utils/provision-env/provision-env', () => ({
  getProvisionEnv: () => ({ sanityManagementToken: 'management-token' }),
}));
vi.mock(
  '@worker/utils/db-provisioning-steps/db-provisioning-steps',
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import('@worker/utils/db-provisioning-steps/db-provisioning-steps')
    >()),
    createTenantSanityProject: vi.fn(),
    persistTenantSanityToken: vi.fn(),
    createTenantRevalidateWebhook: vi.fn(),
    mapTenantDomain: vi.fn(),
  }),
);
vi.mock('workflow', async (importOriginal) => ({
  ...(await importOriginal<typeof import('workflow')>()),
  getStepMetadata: vi.fn(),
}));

function makeTenant(overrides: Partial<TTenant> = {}): TTenant {
  return {
    id: TENANT_ID,
    name: 'Acme',
    primaryDomain: 'acme.example.com',
    sanityProjectId: null,
    sanityDataset: null,
    sanityReadTokenEncrypted: null,
    sanityWriteTokenEncrypted: null,
    locale: LOCALE_ISO_CODES.EN,
    additionalLocales: [],
    plan: TENANT_PLAN.FREE,
    status: TENANT_STATUS.ACTIVE,
    provisioningStatus: null,
    provisioningSteps: null,
    lastNotifiedOwnerElevationOutcome: null,
    seededAt: null,
    webhookCreatedAt: null,
    deprovisionedAt: null,
    deprovisioningSteps: null,
    siteType: null,
    siteTemplateVersion: null,
    ownerSanityInviteId: null,
    ownerInviteSentAt: null,
    ownerInviteAcceptedAt: null,
    ownerSanityUserId: null,
    ownerLoginProvider: null,
    ownerSanityRole: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...overrides,
  };
}

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
    vi.mocked(getTenantById).mockResolvedValue(makeTenant());
    vi.mocked(reactivateTenant).mockResolvedValue({
      ok: true,
      data: makeTenant(),
    });
    vi.mocked(createTenantSanityProject).mockResolvedValue({
      sanityProjectId: 'proj-1',
      sanityDataset: 'production',
    });
    vi.mocked(updateProvisioningStep).mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_NOT_FOUND,
    });
  });

  it('reports the four infrastructure steps in order and succeeds', async () => {
    const result = await ensureInfrastructure(TENANT_ID, CTX);

    expect(result).toEqual({ ok: true });
    expect(runningSteps()).toEqual([
      TENANT_PROVISIONING_STEP.SANITY_PROJECT,
      TENANT_PROVISIONING_STEP.PERSIST_TOKEN,
      TENANT_PROVISIONING_STEP.CREATE_WEBHOOK,
      TENANT_PROVISIONING_STEP.MAP_DOMAIN,
    ]);
  });

  it('hands the project created for the tenant to the later steps', async () => {
    await ensureInfrastructure(TENANT_ID, CTX);

    expect(persistTenantSanityToken).toHaveBeenCalledWith(
      expect.objectContaining({
        sanityProjectId: 'proj-1',
        sanityDataset: 'production',
      }),
      expect.anything(),
    );
    expect(mapTenantDomain).toHaveBeenCalledWith(
      expect.objectContaining({ sanityProjectId: 'proj-1' }),
      expect.anything(),
    );
  });

  it('does not unarchive when the tenant has no Sanity project yet', async () => {
    await ensureInfrastructure(TENANT_ID, CTX);

    expect(unarchiveSanityProject).not.toHaveBeenCalled();
  });

  it('unarchives the existing Sanity project of a reactivated tenant', async () => {
    vi.mocked(reactivateTenant).mockResolvedValue({
      ok: true,
      data: makeTenant({
        sanityProjectId: 'proj-existing',
        sanityDataset: 'production',
      }),
    });

    await ensureInfrastructure(TENANT_ID, CTX);

    expect(unarchiveSanityProject).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 'proj-existing' }),
    );
  });

  it('succeeds again on a second run against the project the first created', async () => {
    const existing = makeTenant({
      sanityProjectId: 'proj-1',
      sanityDataset: 'production',
    });
    vi.mocked(reactivateTenant).mockResolvedValue({ ok: true, data: existing });

    const first = await ensureInfrastructure(TENANT_ID, CTX);
    const second = await ensureInfrastructure(TENANT_ID, CTX);

    expect(first).toEqual({ ok: true });
    expect(second).toEqual({ ok: true });
    expect(createTenantSanityProject).toHaveBeenLastCalledWith(
      expect.objectContaining({ sanityProjectId: 'proj-1' }),
      expect.anything(),
    );
  });

  it('stops at the first failing step on its final attempt', async () => {
    atAttempt(PROVISIONING_UNIT_MAX_RETRIES + 1);
    vi.mocked(persistTenantSanityToken).mockRejectedValue(
      new Error('token mint refused'),
    );

    const result = await ensureInfrastructure(TENANT_ID, CTX);

    expect(result).toEqual({
      ok: false,
      failedStep: TENANT_PROVISIONING_STEP.PERSIST_TOKEN,
    });
    expect(createTenantRevalidateWebhook).not.toHaveBeenCalled();
    expect(mapTenantDomain).not.toHaveBeenCalled();
  });

  it('rethrows a step failure while retries remain', async () => {
    const failure = new Error('vercel rate limited');
    vi.mocked(mapTenantDomain).mockRejectedValue(failure);

    await expect(ensureInfrastructure(TENANT_ID, CTX)).rejects.toBe(failure);

    expect(updateProvisioningStep).not.toHaveBeenCalledWith(
      expect.objectContaining({
        status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
      }),
    );
  });

  it('fails the project step when the tenant cannot be reactivated', async () => {
    vi.mocked(reactivateTenant).mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_NOT_FOUND,
    });

    const result = await ensureInfrastructure(TENANT_ID, CTX);

    expect(result).toEqual({
      ok: false,
      failedStep: TENANT_PROVISIONING_STEP.SANITY_PROJECT,
    });
    expect(createTenantSanityProject).not.toHaveBeenCalled();
  });

  it('throws a fatal error and reports nothing for a missing tenant', async () => {
    vi.mocked(getTenantById).mockResolvedValue(undefined);

    await expect(ensureInfrastructure(TENANT_ID, CTX)).rejects.toThrow(
      FatalError,
    );

    expect(updateProvisioningStep).not.toHaveBeenCalled();
  });
});
