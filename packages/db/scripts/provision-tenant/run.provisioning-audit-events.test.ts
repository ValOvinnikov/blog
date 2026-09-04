import { AUDIT_ACTION, ERROR_CODE } from '@blog/config/constants';
import { TENANT_PROVISIONING_STEP, TENANT_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';

import { runSteps } from './run';

/**
 * Exercises the audit-event side effect `runSteps` writes at each of its
 * terminal points — `recordProvisioningAuditEvent` mocked away here, unlike
 * `run.test.ts`'s step-sequencing coverage, so each call's action/step
 * argument can be asserted directly.
 */

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
const { reportOwnerElevationOutcomeMock } = vi.hoisted(() => ({
  reportOwnerElevationOutcomeMock: vi.fn(),
}));
const { recordProvisioningAuditEventMock } = vi.hoisted(() => ({
  recordProvisioningAuditEventMock: vi.fn(),
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
vi.mock('./lib/report-owner-elevation-outcome', () => ({
  reportOwnerElevationOutcome: reportOwnerElevationOutcomeMock,
}));
vi.mock('./lib/record-provisioning-audit-event', () => ({
  recordProvisioningAuditEvent: recordProvisioningAuditEventMock,
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
  githubActor: 'octocat',
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
  reportOwnerElevationOutcomeMock.mockReset().mockResolvedValue(undefined);
  recordProvisioningAuditEventMock.mockReset().mockResolvedValue(undefined);
  createTenantSanityProjectMock.mockReset().mockResolvedValue({});
  seedTenantContentMock.mockReset().mockResolvedValue(undefined);
  persistTenantSanityTokenMock.mockReset().mockResolvedValue(undefined);
  mapTenantDomainMock.mockReset().mockResolvedValue(undefined);
  createTenantRevalidateWebhookMock.mockReset().mockResolvedValue(undefined);
  elevateTenantOwnerMock.mockReset().mockResolvedValue('PENDING_ACCEPTANCE');
});

describe(runSteps, () => {
  it('records PROVISIONING_FAILED with no step when reactivateTenant fails', async () => {
    reactivateTenantMock.mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_NOT_FOUND,
    });

    const result = await runSteps('tenant-1', env);

    expect(result).toEqual({ ok: false });
    expect(recordProvisioningAuditEventMock).toHaveBeenCalledTimes(1);
    expect(recordProvisioningAuditEventMock).toHaveBeenCalledWith(
      'tenant-1',
      env,
      AUDIT_ACTION.PROVISIONING_FAILED,
    );
  });

  it('records PROVISIONING_FAILED with no step when un-archiving the Sanity project fails', async () => {
    reactivateTenantMock.mockResolvedValue({
      ok: true,
      data: { ...baseTenant, sanityProjectId: 'proj-abc' },
    });
    unarchiveSanityProjectMock.mockRejectedValue(new Error('network error'));

    const result = await runSteps('tenant-1', env);

    expect(result).toEqual({ ok: false });
    expect(recordProvisioningAuditEventMock).toHaveBeenCalledTimes(1);
    expect(recordProvisioningAuditEventMock).toHaveBeenCalledWith(
      'tenant-1',
      env,
      AUDIT_ACTION.PROVISIONING_FAILED,
    );
  });

  it('records PROVISIONING_FAILED with the failing step key when a step throws', async () => {
    seedTenantContentMock.mockRejectedValue(new Error('seed failed'));

    const result = await runSteps('tenant-1', env);

    expect(result).toEqual({ ok: false });
    expect(recordProvisioningAuditEventMock).toHaveBeenCalledTimes(1);
    expect(recordProvisioningAuditEventMock).toHaveBeenCalledWith(
      'tenant-1',
      env,
      AUDIT_ACTION.PROVISIONING_FAILED,
      TENANT_PROVISIONING_STEP.SEED_CONTENT,
    );
  });

  it('records PROVISIONED with no step once every core step succeeds', async () => {
    const result = await runSteps('tenant-1', env);

    expect(result).toEqual({ ok: true });
    expect(recordProvisioningAuditEventMock).toHaveBeenCalledTimes(1);
    expect(recordProvisioningAuditEventMock).toHaveBeenCalledWith(
      'tenant-1',
      env,
      AUDIT_ACTION.PROVISIONED,
    );
  });

  it.each([
    ['ELEVATED', undefined],
    ['STALLED', undefined],
    ['PENDING_ACCEPTANCE', undefined],
    ['AMBIGUOUS_MEMBERSHIP', undefined],
  ])(
    'still records PROVISIONED when owner elevation resolves %s',
    async (outcome) => {
      elevateTenantOwnerMock.mockResolvedValue(outcome);

      const result = await runSteps('tenant-1', env);

      expect(result).toEqual({ ok: true });
      expect(recordProvisioningAuditEventMock).toHaveBeenCalledWith(
        'tenant-1',
        env,
        AUDIT_ACTION.PROVISIONED,
      );
    },
  );

  it('still records PROVISIONED when elevating the owner throws unexpectedly', async () => {
    elevateTenantOwnerMock.mockRejectedValue(new Error('acl fetch failed'));

    const result = await runSteps('tenant-1', env);

    expect(result).toEqual({ ok: true });
    expect(recordProvisioningAuditEventMock).toHaveBeenCalledWith(
      'tenant-1',
      env,
      AUDIT_ACTION.PROVISIONED,
    );
  });

  it('records PROVISIONED before elevateTenantOwner is ever invoked', async () => {
    await runSteps('tenant-1', env);

    const [auditCallOrder] =
      recordProvisioningAuditEventMock.mock.invocationCallOrder;
    const [elevateCallOrder] = elevateTenantOwnerMock.mock.invocationCallOrder;

    expect(auditCallOrder).toBeDefined();
    expect(elevateCallOrder).toBeDefined();
    expect(auditCallOrder).toBeLessThan(elevateCallOrder as number);
  });

  it('never records a PROVISIONED event when an earlier step fails', async () => {
    seedTenantContentMock.mockRejectedValue(new Error('seed failed'));

    await runSteps('tenant-1', env);

    expect(recordProvisioningAuditEventMock).not.toHaveBeenCalledWith(
      'tenant-1',
      env,
      AUDIT_ACTION.PROVISIONED,
    );
  });
});
