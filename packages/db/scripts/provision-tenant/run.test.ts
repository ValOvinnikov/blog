import { ERROR_CODE } from '@blog/config/constants';
import {
  ELEVATE_TENANT_OWNER_OUTCOME,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  TENANT_STATUS,
  type TElevateTenantOwnerOutcome,
} from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';

import { runSteps } from './run';

const { reactivateTenantMock } = vi.hoisted(() => ({
  reactivateTenantMock: vi.fn(),
}));
const { unarchiveSanityProjectMock } = vi.hoisted(() => ({
  unarchiveSanityProjectMock: vi.fn(),
}));
const { reportStepStatusMock } = vi.hoisted(() => ({
  reportStepStatusMock: vi.fn(),
}));
const { reportProvisioningRunStartMock, reportProvisioningRunFinishMock } =
  vi.hoisted(() => ({
    reportProvisioningRunStartMock: vi.fn(),
    reportProvisioningRunFinishMock: vi.fn(),
  }));
const { createTenantSanityProjectMock } = vi.hoisted(() => ({
  createTenantSanityProjectMock: vi.fn(),
}));
const { seedTenantContentMock } = vi.hoisted(() => ({
  seedTenantContentMock: vi.fn(),
}));
const { persistTenantSanityTokenMock } = vi.hoisted(() => ({
  persistTenantSanityTokenMock: vi.fn(),
}));
const { mapTenantDomainMock } = vi.hoisted(() => ({
  mapTenantDomainMock: vi.fn(),
}));
const { createTenantRevalidateWebhookMock } = vi.hoisted(() => ({
  createTenantRevalidateWebhookMock: vi.fn(),
}));
const { elevateTenantOwnerMock } = vi.hoisted(() => ({
  elevateTenantOwnerMock: vi.fn(),
}));
const { notifyOwnerElevationOutcomeMock } = vi.hoisted(() => ({
  notifyOwnerElevationOutcomeMock: vi.fn(),
}));

vi.mock('@blog/db/queries/tenants', () => ({
  reactivateTenant: reactivateTenantMock,
}));
vi.mock(
  '@blog/db/utils/sanity-management-client/sanity-management-client',
  () => ({
    unarchiveSanityProject: unarchiveSanityProjectMock,
  }),
);
vi.mock('./lib/report-step-status', () => ({
  reportStepStatus: reportStepStatusMock,
}));
vi.mock('./lib/report-provisioning-run', () => ({
  reportProvisioningRunStart: reportProvisioningRunStartMock,
  reportProvisioningRunFinish: reportProvisioningRunFinishMock,
}));
vi.mock('./steps/create-sanity-project', () => ({
  createTenantSanityProject: createTenantSanityProjectMock,
}));
vi.mock('./steps/seed-content', () => ({
  seedTenantContent: seedTenantContentMock,
}));
vi.mock('./steps/persist-sanity-token', () => ({
  persistTenantSanityToken: persistTenantSanityTokenMock,
}));
vi.mock('./steps/map-domain', () => ({
  mapTenantDomain: mapTenantDomainMock,
}));
vi.mock('./steps/create-revalidate-webhook', () => ({
  createTenantRevalidateWebhook: createTenantRevalidateWebhookMock,
}));
vi.mock('./steps/elevate-tenant-owner', () => ({
  elevateTenantOwner: elevateTenantOwnerMock,
}));
vi.mock('./lib/notify-owner-elevation-outcome', () => ({
  notifyOwnerElevationOutcome: notifyOwnerElevationOutcomeMock,
}));

const baseTenant = {
  id: 'tenant-1',
  name: 'Acme',
  status: TENANT_STATUS.ACTIVE,
  deprovisionedAt: null,
} as TTenant;
const env = {
  sanityManagementToken: 'sanity-token',
  sanityOrganizationId: 'org-abc',
  vercelToken: 'vercel-token',
  vercelTeamId: undefined,
  vercelWebProjectId: 'proj-1',
  adminAppBaseUrl: 'https://admin.example.com',
  tenantSanityDataset: 'test-dataset',
  webAppBaseUrl: 'https://example.com',
  revalidateSecret: 'revalidate-shh',
  githubRunId: undefined,
  githubRepository: undefined,
  githubServerUrl: undefined,
  githubActor: undefined,
  tenantRegistryEnvironment: undefined,
};

beforeEach(() => {
  reactivateTenantMock
    .mockReset()
    .mockResolvedValue({ ok: true, data: baseTenant });
  unarchiveSanityProjectMock
    .mockReset()
    .mockResolvedValue({ outcome: 'unarchived' });
  reportStepStatusMock.mockReset().mockResolvedValue(undefined);
  reportProvisioningRunStartMock.mockReset().mockResolvedValue(undefined);
  reportProvisioningRunFinishMock.mockReset().mockResolvedValue(undefined);
  createTenantSanityProjectMock.mockReset();
  seedTenantContentMock.mockReset().mockResolvedValue(undefined);
  persistTenantSanityTokenMock.mockReset().mockResolvedValue(undefined);
  mapTenantDomainMock.mockReset().mockResolvedValue(undefined);
  createTenantRevalidateWebhookMock.mockReset().mockResolvedValue(undefined);
  elevateTenantOwnerMock.mockReset().mockResolvedValue('PENDING_ACCEPTANCE');
  notifyOwnerElevationOutcomeMock.mockReset().mockResolvedValue(undefined);
});

describe(runSteps, () => {
  it('reports RUNNING then DONE for every step, in order, on a clean run', async () => {
    createTenantSanityProjectMock.mockResolvedValue({});

    const result = await runSteps('tenant-1', env);

    expect(result).toEqual({ ok: true });
    expect(createTenantSanityProjectMock).toHaveBeenCalledTimes(1);
    expect(seedTenantContentMock).toHaveBeenCalledTimes(1);
    expect(persistTenantSanityTokenMock).toHaveBeenCalledTimes(1);
    expect(mapTenantDomainMock).toHaveBeenCalledTimes(1);
    expect(createTenantRevalidateWebhookMock).toHaveBeenCalledTimes(1);

    const statuses = reportStepStatusMock.mock.calls.map((call) => {
      const [input] = call as [{ step: string; status: string }];
      return [input.step, input.status];
    });
    expect(statuses).toEqual([
      [
        TENANT_PROVISIONING_STEP.SANITY_PROJECT,
        TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      ],
      [
        TENANT_PROVISIONING_STEP.SANITY_PROJECT,
        TENANT_PROVISIONING_STEP_STATUS.DONE,
      ],
      [
        TENANT_PROVISIONING_STEP.SEED_CONTENT,
        TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      ],
      [
        TENANT_PROVISIONING_STEP.SEED_CONTENT,
        TENANT_PROVISIONING_STEP_STATUS.DONE,
      ],
      [
        TENANT_PROVISIONING_STEP.PERSIST_TOKEN,
        TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      ],
      [
        TENANT_PROVISIONING_STEP.PERSIST_TOKEN,
        TENANT_PROVISIONING_STEP_STATUS.DONE,
      ],
      [
        TENANT_PROVISIONING_STEP.MAP_DOMAIN,
        TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      ],
      [
        TENANT_PROVISIONING_STEP.MAP_DOMAIN,
        TENANT_PROVISIONING_STEP_STATUS.DONE,
      ],
      [
        TENANT_PROVISIONING_STEP.CREATE_WEBHOOK,
        TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      ],
      [
        TENANT_PROVISIONING_STEP.CREATE_WEBHOOK,
        TENANT_PROVISIONING_STEP_STATUS.DONE,
      ],
      [
        TENANT_PROVISIONING_STEP.OWNER_ELEVATION,
        TENANT_PROVISIONING_STEP_STATUS.DONE,
      ],
    ]);
  });

  it('merges each step result into the tenant row passed to the next step', async () => {
    createTenantSanityProjectMock.mockResolvedValue({
      sanityProjectId: 'proj-abc',
    });

    await runSteps('tenant-1', env);

    const [tenantSeenBySeed] = seedTenantContentMock.mock.calls[0] as [TTenant];
    expect(tenantSeenBySeed).toMatchObject({ sanityProjectId: 'proj-abc' });

    const [tenantSeenByPersist] = persistTenantSanityTokenMock.mock
      .calls[0] as [TTenant];
    expect(tenantSeenByPersist).toMatchObject({
      sanityProjectId: 'proj-abc',
    });
  });

  it('stops at the first failing step, reports FAILED, and never runs later steps', async () => {
    createTenantSanityProjectMock.mockResolvedValue({});
    seedTenantContentMock.mockRejectedValue(new Error('seed failed'));

    const result = await runSteps('tenant-1', env);

    expect(result).toEqual({ ok: false });
    expect(persistTenantSanityTokenMock).not.toHaveBeenCalled();
    expect(mapTenantDomainMock).not.toHaveBeenCalled();
    expect(createTenantRevalidateWebhookMock).not.toHaveBeenCalled();

    const lastCall = reportStepStatusMock.mock.calls.at(-1) as [
      { step: string; status: string; error: string },
    ];
    expect(lastCall[0]).toMatchObject({
      step: TENANT_PROVISIONING_STEP.SEED_CONTENT,
      status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
      error: 'seed failed',
    });
  });

  it('reactivates a previously archived tenant before any step runs', async () => {
    const archivedTenant = {
      ...baseTenant,
      status: TENANT_STATUS.ARCHIVED,
      deprovisionedAt: new Date('2026-01-01T00:00:00.000Z'),
    } as TTenant;
    reactivateTenantMock.mockResolvedValue({
      ok: true,
      data: {
        ...archivedTenant,
        status: TENANT_STATUS.ACTIVE,
        deprovisionedAt: null,
      },
    });
    createTenantSanityProjectMock.mockResolvedValue({});

    const result = await runSteps('tenant-1', env);

    expect(result).toEqual({ ok: true });
    expect(reactivateTenantMock).toHaveBeenCalledWith('tenant-1');

    const [tenantSeenBySanityProject] = createTenantSanityProjectMock.mock
      .calls[0] as [TTenant];
    expect(tenantSeenBySanityProject.status).toBe(TENANT_STATUS.ACTIVE);
    expect(tenantSeenBySanityProject.deprovisionedAt).toBeNull();
  });

  it("un-archives a re-provisioned tenant's existing Sanity project before any step runs", async () => {
    reactivateTenantMock.mockResolvedValue({
      ok: true,
      data: { ...baseTenant, sanityProjectId: 'proj-abc' },
    });
    createTenantSanityProjectMock.mockResolvedValue({});

    const result = await runSteps('tenant-1', env);

    expect(result).toEqual({ ok: true });
    expect(unarchiveSanityProjectMock).toHaveBeenCalledWith({
      token: 'sanity-token',
      projectId: 'proj-abc',
    });
    // Un-archiving happens before the first step reports RUNNING.
    const [unarchiveCallOrder] =
      unarchiveSanityProjectMock.mock.invocationCallOrder;
    const [firstReportCallOrder] =
      reportStepStatusMock.mock.invocationCallOrder;
    expect(unarchiveCallOrder).toBeDefined();
    expect(firstReportCallOrder).toBeDefined();
    expect(unarchiveCallOrder).toBeLessThan(firstReportCallOrder as number);
  });

  it('does not attempt to un-archive a first-time provision with no existing Sanity project', async () => {
    createTenantSanityProjectMock.mockResolvedValue({});

    await runSteps('tenant-1', env);

    expect(unarchiveSanityProjectMock).not.toHaveBeenCalled();
  });

  it('stops before any step when un-archiving the Sanity project fails', async () => {
    reactivateTenantMock.mockResolvedValue({
      ok: true,
      data: { ...baseTenant, sanityProjectId: 'proj-abc' },
    });
    unarchiveSanityProjectMock.mockRejectedValue(new Error('network error'));

    const result = await runSteps('tenant-1', env);

    expect(result).toEqual({ ok: false });
    expect(createTenantSanityProjectMock).not.toHaveBeenCalled();
    expect(reportStepStatusMock).not.toHaveBeenCalled();
  });

  it('stops before any step when reactivateTenant fails', async () => {
    reactivateTenantMock.mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_NOT_FOUND,
    });

    const result = await runSteps('tenant-1', env);

    expect(result).toEqual({ ok: false });
    expect(createTenantSanityProjectMock).not.toHaveBeenCalled();
    expect(reportStepStatusMock).not.toHaveBeenCalled();
  });

  it('elevates the tenant owner once every core step succeeds', async () => {
    createTenantSanityProjectMock.mockResolvedValue({});
    elevateTenantOwnerMock.mockResolvedValue('ELEVATED');

    const result = await runSteps('tenant-1', env);

    expect(result).toEqual({ ok: true });
    expect(elevateTenantOwnerMock).toHaveBeenCalledTimes(1);
    const [tenantSeen] = elevateTenantOwnerMock.mock.calls[0] as [TTenant];
    expect(tenantSeen.id).toBe('tenant-1');
  });

  it('still reports ok:true when the owner has not yet accepted (PENDING_ACCEPTANCE/STALLED)', async () => {
    createTenantSanityProjectMock.mockResolvedValue({});
    elevateTenantOwnerMock.mockResolvedValue('STALLED');

    const result = await runSteps('tenant-1', env);

    expect(result).toEqual({ ok: true });
  });

  it('still reports ok:true when membership is ambiguous (more than one human member)', async () => {
    createTenantSanityProjectMock.mockResolvedValue({});
    elevateTenantOwnerMock.mockResolvedValue('AMBIGUOUS_MEMBERSHIP');

    const result = await runSteps('tenant-1', env);

    expect(result).toEqual({ ok: true });
  });

  it('still reports ok:true when elevating the owner throws unexpectedly', async () => {
    createTenantSanityProjectMock.mockResolvedValue({});
    elevateTenantOwnerMock.mockRejectedValue(new Error('acl fetch failed'));

    const result = await runSteps('tenant-1', env);

    expect(result).toEqual({ ok: true });
  });

  it('notifies operators of a notifiable owner-elevation outcome once core provisioning finishes', async () => {
    createTenantSanityProjectMock.mockResolvedValue({});
    elevateTenantOwnerMock.mockResolvedValue('STALLED');

    await runSteps('tenant-1', env);

    expect(notifyOwnerElevationOutcomeMock).toHaveBeenCalledTimes(1);
    expect(notifyOwnerElevationOutcomeMock).toHaveBeenCalledWith({
      tenant: expect.objectContaining({ id: 'tenant-1' }),
      outcome: 'STALLED',
    });
  });

  it('never notifies when an earlier step fails', async () => {
    createTenantSanityProjectMock.mockResolvedValue({});
    seedTenantContentMock.mockRejectedValue(new Error('seed failed'));

    await runSteps('tenant-1', env);

    expect(notifyOwnerElevationOutcomeMock).not.toHaveBeenCalled();
  });

  it('never elevates the owner when an earlier step fails', async () => {
    createTenantSanityProjectMock.mockResolvedValue({});
    seedTenantContentMock.mockRejectedValue(new Error('seed failed'));

    await runSteps('tenant-1', env);

    expect(elevateTenantOwnerMock).not.toHaveBeenCalled();
    expect(reportStepStatusMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        step: TENANT_PROVISIONING_STEP.OWNER_ELEVATION,
      }),
    );
  });

  it.each(Object.values(ELEVATE_TENANT_OWNER_OUTCOME))(
    'persists %s as the OWNER_ELEVATION step detail, always alongside DONE',
    async (outcome: TElevateTenantOwnerOutcome) => {
      createTenantSanityProjectMock.mockResolvedValue({});
      elevateTenantOwnerMock.mockResolvedValue(outcome);

      await runSteps('tenant-1', env);

      expect(reportStepStatusMock).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        step: TENANT_PROVISIONING_STEP.OWNER_ELEVATION,
        status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        detail: outcome,
      });
    },
  );

  it('never reports the OWNER_ELEVATION step when elevating the owner throws', async () => {
    createTenantSanityProjectMock.mockResolvedValue({});
    elevateTenantOwnerMock.mockRejectedValue(new Error('acl fetch failed'));

    await runSteps('tenant-1', env);

    expect(reportStepStatusMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        step: TENANT_PROVISIONING_STEP.OWNER_ELEVATION,
      }),
    );
  });

  it('starts the run with the registry and workflow run URL before the first step', async () => {
    createTenantSanityProjectMock.mockResolvedValue({});

    await runSteps('tenant-1', {
      ...env,
      tenantRegistryEnvironment: 'production',
      githubServerUrl: 'https://github.com',
      githubRepository: 'acme/blog',
      githubRunId: '123',
    });

    expect(reportProvisioningRunStartMock).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      registry: 'production',
      workflowRunUrl: 'https://github.com/acme/blog/actions/runs/123',
    });
    const [startCallOrder] =
      reportProvisioningRunStartMock.mock.invocationCallOrder;
    const [firstStepReportCallOrder] =
      reportStepStatusMock.mock.invocationCallOrder;
    expect(startCallOrder).toBeLessThan(firstStepReportCallOrder as number);
  });

  it('omits registry and workflowRunUrl entirely when the underlying env vars are unset', async () => {
    createTenantSanityProjectMock.mockResolvedValue({});

    await runSteps('tenant-1', env);

    expect(reportProvisioningRunStartMock).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
    });
  });

  it('finishes the run once every step succeeds', async () => {
    createTenantSanityProjectMock.mockResolvedValue({});

    await runSteps('tenant-1', env);

    expect(reportProvisioningRunFinishMock).toHaveBeenCalledWith('tenant-1');
  });

  it('finishes the run when a step fails', async () => {
    createTenantSanityProjectMock.mockResolvedValue({});
    seedTenantContentMock.mockRejectedValue(new Error('seed failed'));

    await runSteps('tenant-1', env);

    expect(reportProvisioningRunFinishMock).toHaveBeenCalledWith('tenant-1');
  });

  it('never starts or finishes a run when reactivateTenant fails', async () => {
    reactivateTenantMock.mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_NOT_FOUND,
    });

    await runSteps('tenant-1', env);

    expect(reportProvisioningRunStartMock).not.toHaveBeenCalled();
    expect(reportProvisioningRunFinishMock).not.toHaveBeenCalled();
  });

  it('never starts or finishes a run when un-archiving the Sanity project fails', async () => {
    reactivateTenantMock.mockResolvedValue({
      ok: true,
      data: { ...baseTenant, sanityProjectId: 'proj-abc' },
    });
    unarchiveSanityProjectMock.mockRejectedValue(new Error('network error'));

    await runSteps('tenant-1', env);

    expect(reportProvisioningRunStartMock).not.toHaveBeenCalled();
    expect(reportProvisioningRunFinishMock).not.toHaveBeenCalled();
  });
});
