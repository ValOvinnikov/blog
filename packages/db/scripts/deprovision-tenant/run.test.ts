import {
  CORE_DEPROVISIONING_STEPS,
  DEPROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  type TDeprovisioningStep,
} from '@blog/db/constants';
import { listTenantHosts } from '@blog/db/queries/tenant-domains/list-tenant-hosts';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  MOCK_DEPROVISION_DRY_RUN_ENV,
  MOCK_DEPROVISION_ENV,
  MOCK_DEPROVISIONED_AT,
} from '@blog/db/testing/deprovision-tenant/fixtures';
import { MOCK_STEP_ERROR, mockTenant } from '@blog/db/testing/tenants/fixtures';
import { faker } from '@faker-js/faker';
import type { Mock } from 'vitest';

import type { TDeprovisionEnv } from './lib/env';
import {
  reportDeprovisioningRunFinish,
  reportDeprovisioningRunStart,
} from './lib/report-deprovisioning-run';
import { reportDeprovisioningStepStatus } from './lib/report-deprovisioning-step-status';
import { runDeprovisioning, runSteps } from './run';
import { archiveTenantSanityProject } from './steps/archive-sanity-project';
import { archiveTenantRow } from './steps/archive-tenant';
import { clearTenantArtifacts } from './steps/clear-artifacts';
import { invalidateTenantCache } from './steps/invalidate-tenant-cache';
import { purgeTenantReaderData } from './steps/purge-reader-data';
import { removeTenantDomain } from './steps/remove-domain';
import { revokeTenantSanityTokens } from './steps/revoke-sanity-tokens';

vi.mock('./steps/remove-domain');
vi.mock('./steps/archive-sanity-project');
vi.mock('./steps/revoke-sanity-tokens');
vi.mock('./steps/clear-artifacts');
vi.mock('./steps/archive-tenant');
vi.mock('./steps/purge-reader-data');
vi.mock('./steps/invalidate-tenant-cache');
vi.mock('./lib/report-deprovisioning-step-status');
vi.mock('./lib/report-deprovisioning-run');
vi.mock('@blog/db/queries/tenant-domains/list-tenant-hosts');

faker.seed(5765);

const MOCK_TENANT = mockTenant();
const MOCK_WRONG_CONFIRM = faker.string.alphanumeric(12);

const STEP_MOCKS: [
  TDeprovisioningStep,
  Mock<(tenant: TTenant, env: TDeprovisionEnv) => Promise<void>>,
][] = [
  [DEPROVISIONING_STEP.REMOVE_DOMAIN, vi.mocked(removeTenantDomain)],
  [
    DEPROVISIONING_STEP.ARCHIVE_SANITY_PROJECT,
    vi.mocked(archiveTenantSanityProject),
  ],
  [
    DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS,
    vi.mocked(revokeTenantSanityTokens),
  ],
  [DEPROVISIONING_STEP.CLEAR_ARTIFACTS, vi.mocked(clearTenantArtifacts)],
  [DEPROVISIONING_STEP.ARCHIVE_TENANT, vi.mocked(archiveTenantRow)],
  [DEPROVISIONING_STEP.PURGE_READER_DATA, vi.mocked(purgeTenantReaderData)],
  [
    DEPROVISIONING_STEP.INVALIDATE_TENANT_CACHE,
    vi.mocked(invalidateTenantCache),
  ],
];

describe(runSteps, () => {
  it('runs every step in dependency order', async () => {
    const callOrder: TDeprovisioningStep[] = [];
    for (const [step, mock] of STEP_MOCKS) {
      mock.mockImplementation(async () => {
        callOrder.push(step);
      });
    }

    await runSteps(MOCK_TENANT, MOCK_DEPROVISION_ENV);

    expect(callOrder).toEqual(STEP_MOCKS.map(([step]) => step));
  });

  it('reports RUNNING for each step in CORE_DEPROVISIONING_STEPS order', async () => {
    await runSteps(MOCK_TENANT, MOCK_DEPROVISION_ENV);

    const reportedOrder = vi
      .mocked(reportDeprovisioningStepStatus)
      .mock.calls.map(([call]) => call)
      .filter((call) => call.status === TENANT_PROVISIONING_STEP_STATUS.RUNNING)
      .map((call) => call.step);

    expect(reportedOrder).toEqual(CORE_DEPROVISIONING_STEPS);
  });

  it('reports failure without undoing archive and purge when invalidation fails', async () => {
    vi.mocked(invalidateTenantCache).mockRejectedValueOnce(
      new Error(MOCK_STEP_ERROR),
    );

    const result = await runSteps(MOCK_TENANT, MOCK_DEPROVISION_ENV);

    expect(result).toEqual({ ok: false });
    expect(archiveTenantRow).toHaveBeenCalledTimes(1);
    expect(purgeTenantReaderData).toHaveBeenCalledTimes(1);
    expect(invalidateTenantCache).toHaveBeenCalledTimes(1);
  });

  it('passes the same tenant row and env through to every step', async () => {
    await runSteps(MOCK_TENANT, MOCK_DEPROVISION_ENV);

    for (const [, mock] of STEP_MOCKS) {
      expect(mock).toHaveBeenCalledWith(MOCK_TENANT, MOCK_DEPROVISION_ENV);
    }
  });

  it('records run start, each step RUNNING then DONE, and run finish', async () => {
    const result = await runSteps(MOCK_TENANT, MOCK_DEPROVISION_ENV);

    expect(result).toEqual({ ok: true });
    expect(reportDeprovisioningRunStart).toHaveBeenCalledTimes(1);
    expect(reportDeprovisioningRunStart).toHaveBeenCalledWith({
      tenantId: MOCK_TENANT.id,
      workflowRunUrl: `${MOCK_DEPROVISION_ENV.githubServerUrl}/${MOCK_DEPROVISION_ENV.githubRepository}/actions/runs/${MOCK_DEPROVISION_ENV.githubRunId}`,
    });
    for (const step of CORE_DEPROVISIONING_STEPS) {
      expect(reportDeprovisioningStepStatus).toHaveBeenCalledWith({
        tenantId: MOCK_TENANT.id,
        step,
        status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      });
      expect(reportDeprovisioningStepStatus).toHaveBeenCalledWith({
        tenantId: MOCK_TENANT.id,
        step,
        status: TENANT_PROVISIONING_STEP_STATUS.DONE,
      });
    }
    expect(reportDeprovisioningRunFinish).toHaveBeenCalledTimes(1);
    expect(reportDeprovisioningRunFinish).toHaveBeenCalledWith(MOCK_TENANT.id);
  });

  it('writes nothing to deprovisioning step state during a dry run', async () => {
    const result = await runSteps(MOCK_TENANT, MOCK_DEPROVISION_DRY_RUN_ENV);

    expect(result).toEqual({ ok: true });
    expect(reportDeprovisioningRunStart).not.toHaveBeenCalled();
    expect(reportDeprovisioningStepStatus).not.toHaveBeenCalled();
    expect(reportDeprovisioningRunFinish).not.toHaveBeenCalled();
  });

  it('continues the teardown when a step-status write itself throws', async () => {
    vi.mocked(reportDeprovisioningStepStatus).mockRejectedValueOnce(
      new Error(MOCK_STEP_ERROR),
    );

    const result = await runSteps(MOCK_TENANT, MOCK_DEPROVISION_ENV);

    expect(result).toEqual({ ok: true });
    expect(removeTenantDomain).toHaveBeenCalledTimes(1);
    expect(archiveTenantSanityProject).toHaveBeenCalledTimes(1);
    expect(invalidateTenantCache).toHaveBeenCalledTimes(1);
  });

  it('still runs archive-tenant when recording the run start throws', async () => {
    vi.mocked(reportDeprovisioningRunStart).mockRejectedValueOnce(
      new Error(MOCK_STEP_ERROR),
    );

    const result = await runSteps(MOCK_TENANT, MOCK_DEPROVISION_ENV);

    expect(result).toEqual({ ok: true });
    expect(archiveTenantRow).toHaveBeenCalledTimes(1);
  });

  describe('when archive-sanity-project throws', () => {
    beforeEach(() => {
      vi.mocked(archiveTenantSanityProject).mockRejectedValueOnce(
        new Error(MOCK_STEP_ERROR),
      );
    });

    it('stops at the first failing step and never runs later steps', async () => {
      const result = await runSteps(MOCK_TENANT, MOCK_DEPROVISION_ENV);

      expect(result).toEqual({ ok: false });
      expect(removeTenantDomain).toHaveBeenCalledTimes(1);
      expect(archiveTenantSanityProject).toHaveBeenCalledTimes(1);
      expect(revokeTenantSanityTokens).not.toHaveBeenCalled();
      expect(clearTenantArtifacts).not.toHaveBeenCalled();
      expect(archiveTenantRow).not.toHaveBeenCalled();
      expect(purgeTenantReaderData).not.toHaveBeenCalled();
      expect(invalidateTenantCache).not.toHaveBeenCalled();
    });

    it('records the failed step with its error and finishes the run', async () => {
      const result = await runSteps(MOCK_TENANT, MOCK_DEPROVISION_ENV);

      expect(result).toEqual({ ok: false });
      expect(vi.mocked(reportDeprovisioningStepStatus).mock.calls).toEqual([
        [
          {
            tenantId: MOCK_TENANT.id,
            step: DEPROVISIONING_STEP.REMOVE_DOMAIN,
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
        ],
        [
          {
            tenantId: MOCK_TENANT.id,
            step: DEPROVISIONING_STEP.REMOVE_DOMAIN,
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
          },
        ],
        [
          {
            tenantId: MOCK_TENANT.id,
            step: DEPROVISIONING_STEP.ARCHIVE_SANITY_PROJECT,
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
        ],
        [
          {
            tenantId: MOCK_TENANT.id,
            step: DEPROVISIONING_STEP.ARCHIVE_SANITY_PROJECT,
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error: MOCK_STEP_ERROR,
          },
        ],
      ]);
      expect(reportDeprovisioningRunFinish).toHaveBeenCalledTimes(1);
    });

    it('reports nothing during a dry run even though the step throws', async () => {
      const result = await runSteps(MOCK_TENANT, MOCK_DEPROVISION_DRY_RUN_ENV);

      expect(result).toEqual({ ok: false });
      expect(reportDeprovisioningStepStatus).not.toHaveBeenCalled();
      expect(reportDeprovisioningRunFinish).not.toHaveBeenCalled();
    });
  });
});

describe(runDeprovisioning, () => {
  const { tenantRootDomain } = MOCK_DEPROVISION_ENV;

  beforeEach(() => {
    vi.mocked(listTenantHosts).mockResolvedValue([MOCK_TENANT.primaryDomain]);
  });

  it.each([
    ['the root domain', tenantRootDomain],
    ['the www host of the root domain', `www.${tenantRootDomain}`],
  ])(
    'refuses the platform tenant holding %s before any step runs',
    async (_, host) => {
      vi.mocked(listTenantHosts).mockResolvedValue([
        MOCK_TENANT.primaryDomain,
        host,
      ]);

      await expect(
        runDeprovisioning(MOCK_TENANT, MOCK_TENANT.name, MOCK_DEPROVISION_ENV),
      ).rejects.toThrow(
        `deprovision-tenant: tenant "${MOCK_TENANT.id}" ("${MOCK_TENANT.name}") holds the platform root domain "${tenantRootDomain}" — the platform tenant is never deprovisioned, aborting before any destructive action.`,
      );

      for (const [, mock] of STEP_MOCKS) {
        expect(mock).not.toHaveBeenCalled();
      }
      expect(reportDeprovisioningRunStart).not.toHaveBeenCalled();
    },
  );

  it('throws before any step runs when confirm does not match the name', async () => {
    await expect(
      runDeprovisioning(MOCK_TENANT, MOCK_WRONG_CONFIRM, MOCK_DEPROVISION_ENV),
    ).rejects.toThrow(
      `deprovision-tenant: --confirm="${MOCK_WRONG_CONFIRM}" does not match tenant name "${MOCK_TENANT.name}" — aborting before any destructive action.`,
    );

    for (const [, mock] of STEP_MOCKS) {
      expect(mock).not.toHaveBeenCalled();
    }
  });

  it('runs every step when confirm matches the name', async () => {
    const result = await runDeprovisioning(
      MOCK_TENANT,
      MOCK_TENANT.name,
      MOCK_DEPROVISION_ENV,
    );

    expect(result).toEqual({ ok: true });
    for (const [, mock] of STEP_MOCKS) {
      expect(mock).toHaveBeenCalledTimes(1);
    }
  });

  it('skips every step without checking confirm when already deprovisioned', async () => {
    const result = await runDeprovisioning(
      { ...MOCK_TENANT, deprovisionedAt: MOCK_DEPROVISIONED_AT },
      MOCK_WRONG_CONFIRM,
      MOCK_DEPROVISION_ENV,
    );

    expect(result).toEqual({ ok: true, skipped: true });
    for (const [, mock] of STEP_MOCKS) {
      expect(mock).not.toHaveBeenCalled();
    }
  });
});
