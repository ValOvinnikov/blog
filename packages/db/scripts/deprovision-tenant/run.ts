import {
  DEPROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  type TDeprovisioningStep,
  type TTenantProvisioningStepStatus,
} from '@shinefold/db/constants';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { sanitizeLogMessage } from '@shinefold/insight';
import { isUndefined } from '@shinefold/utils/primitives';

import { parseDryRun, readRequiredTenantId } from '../lib/cli-flags';
import { runIfEntrypoint } from '../lib/run-if-entrypoint';
import { workflowRunUrl } from '../lib/workflow-run-url/workflow-run-url';

import { assertNotPlatformTenant } from './lib/assert-not-platform-tenant';
import { loadDeprovisionEnv, type TDeprovisionEnv } from './lib/env';
import { getTenantRow } from './lib/get-tenant-row';
import { parseConfirm } from './lib/parse-confirm';
import {
  reportDeprovisioningRunFinish,
  reportDeprovisioningRunStart,
} from './lib/report-deprovisioning-run';
import { reportDeprovisioningStepStatus } from './lib/report-deprovisioning-step-status';
import { TOOL } from './lib/tool';
import { archiveTenantSanityProject } from './steps/archive-sanity-project';
import { archiveTenantRow } from './steps/archive-tenant';
import { clearTenantArtifacts } from './steps/clear-artifacts';
import { invalidateTenantCache } from './steps/invalidate-tenant-cache';
import { purgeTenantReaderData } from './steps/purge-reader-data';
import { removeTenantDomain } from './steps/remove-domain';
import { revokeTenantSanityTokens } from './steps/revoke-sanity-tokens';

type TStep = {
  key: TDeprovisioningStep;
  name: string;
  run: (tenant: TTenant, env: TDeprovisionEnv) => Promise<void>;
};

const STEPS: TStep[] = [
  {
    key: DEPROVISIONING_STEP.REMOVE_DOMAIN,
    name: 'remove-domain',
    run: removeTenantDomain,
  },
  {
    key: DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS,
    name: 'revoke-sanity-tokens',
    run: revokeTenantSanityTokens,
  },
  {
    key: DEPROVISIONING_STEP.ARCHIVE_SANITY_PROJECT,
    name: 'archive-sanity-project',
    run: archiveTenantSanityProject,
  },
  {
    key: DEPROVISIONING_STEP.CLEAR_ARTIFACTS,
    name: 'clear-artifacts',
    run: clearTenantArtifacts,
  },
  {
    key: DEPROVISIONING_STEP.ARCHIVE_TENANT,
    name: 'archive-tenant',
    run: archiveTenantRow,
  },
  {
    key: DEPROVISIONING_STEP.PURGE_READER_DATA,
    name: 'purge-reader-data',
    run: purgeTenantReaderData,
  },
  {
    key: DEPROVISIONING_STEP.INVALIDATE_TENANT_CACHE,
    name: 'invalidate-tenant-cache',
    run: invalidateTenantCache,
  },
];

async function recordStepStatus(
  tenantId: string,
  step: TDeprovisioningStep,
  status: TTenantProvisioningStepStatus,
  error?: string,
): Promise<void> {
  try {
    await reportDeprovisioningStepStatus({
      tenantId,
      step,
      status,
      ...(isUndefined(error) ? {} : { error }),
    });
  } catch (reportError) {
    console.error(
      `deprovision-tenant: failed to record step "${step}" status "${status}" for tenant "${tenantId}": ${sanitizeLogMessage(reportError)}`,
    );
  }
}

async function recordRunStart(
  tenant: TTenant,
  env: TDeprovisionEnv,
): Promise<void> {
  try {
    const runUrl = workflowRunUrl({
      serverUrl: env.githubServerUrl,
      repository: env.githubRepository,
      runId: env.githubRunId,
    });

    await reportDeprovisioningRunStart({
      tenantId: tenant.id,
      ...(isUndefined(runUrl) ? {} : { workflowRunUrl: runUrl }),
    });
  } catch (error) {
    console.error(
      `deprovision-tenant: failed to record run start for tenant "${tenant.id}": ${sanitizeLogMessage(error)}`,
    );
  }
}

async function recordRunFinish(tenantId: string): Promise<void> {
  try {
    await reportDeprovisioningRunFinish(tenantId);
  } catch (error) {
    console.error(
      `deprovision-tenant: failed to record run finish for tenant "${tenantId}": ${sanitizeLogMessage(error)}`,
    );
  }
}

export async function runSteps(
  tenant: TTenant,
  env: TDeprovisionEnv,
): Promise<{ ok: boolean }> {
  if (env.dryRun === false) {
    await recordRunStart(tenant, env);
  }

  for (const step of STEPS) {
    console.warn(`deprovision-tenant: running step "${step.name}"...`);

    if (env.dryRun === false) {
      await recordStepStatus(
        tenant.id,
        step.key,
        TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      );
    }

    try {
      await step.run(tenant, env);
      console.warn(`deprovision-tenant: step "${step.name}" done.`);

      if (env.dryRun === false) {
        await recordStepStatus(
          tenant.id,
          step.key,
          TENANT_PROVISIONING_STEP_STATUS.DONE,
        );
      }
    } catch (error) {
      const message = sanitizeLogMessage(error);
      console.error(
        `deprovision-tenant: step "${step.name}" failed: ${message}`,
      );

      if (env.dryRun === false) {
        await recordStepStatus(
          tenant.id,
          step.key,
          TENANT_PROVISIONING_STEP_STATUS.FAILED,
          message,
        );
        await recordRunFinish(tenant.id);
      }

      return { ok: false };
    }
  }

  if (env.dryRun === false) {
    await recordRunFinish(tenant.id);
  }

  return { ok: true };
}

export type TRunDeprovisioningResult = { ok: boolean; skipped?: true };

export async function runDeprovisioning(
  tenant: TTenant,
  confirm: string,
  env: TDeprovisionEnv,
): Promise<TRunDeprovisioningResult> {
  await assertNotPlatformTenant(tenant, env);

  if (tenant.deprovisionedAt) {
    console.warn(
      `deprovision-tenant: tenant "${tenant.id}" is already deprovisioned (at ${tenant.deprovisionedAt.toISOString()}) — nothing to do.`,
    );
    return { ok: true, skipped: true };
  }

  if (confirm !== tenant.name) {
    throw new Error(
      `deprovision-tenant: --confirm="${confirm}" does not match tenant name "${tenant.name}" — aborting before any destructive action.`,
    );
  }

  if (env.dryRun) {
    console.warn(
      `deprovision-tenant: DRY RUN for tenant "${tenant.id}" ("${tenant.name}") — no changes will be made.`,
    );
  }

  return runSteps(tenant, env);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const tenantId = readRequiredTenantId(argv, TOOL);
  const confirm = parseConfirm(argv);
  const dryRun = parseDryRun(argv);
  const env = loadDeprovisionEnv(dryRun);

  const tenant = await getTenantRow(tenantId);

  const { ok } = await runDeprovisioning(tenant, confirm, env);
  if (!ok) {
    process.exitCode = 1;
  }
}

runIfEntrypoint(import.meta.url, main, TOOL);
