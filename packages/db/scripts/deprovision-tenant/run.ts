/**
 * Deprovisioning workflow entrypoint — reverses `provision-tenant`'s steps
 * for one tenant: removes its domain from the shared web project, archives
 * (never deletes) its Sanity project, revokes the provisioned Sanity robot
 * tokens still live in that project, clears the provisioning-artifact
 * columns, archives (never hard-deletes) the `tenants` row, then
 * invalidates its cached pages so the archived site stops serving.
 *
 * Invoked only by `.github/workflows/deprovision-tenant.yml` via
 * `pnpm --filter @blog/db db:deprovision-tenant -- --tenant-id=<uuid>
 * --confirm=<name>` — never run by hand against a shared/production tenant
 * outside that workflow. Defaults to a dry run (`--dry-run` unset or
 * anything other than `"false"`); an operator must pass `--dry-run=false`
 * to actually delete anything, on top of `--confirm` matching the tenant's
 * name.
 *
 * `--conditions=react-server` makes `getDb()`'s `import 'server-only'`
 * resolve to a no-op outside Next.js's own build, same trick
 * `provision-tenant/run.ts` relies on.
 */
import { pathToFileURL } from 'node:url';

import {
  DEPROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  type TDeprovisioningStep,
  type TTenantProvisioningStepStatus,
} from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { sanitizeLogMessage } from '@blog/insight';

import { workflowRunUrl } from '../lib/workflow-run-url/workflow-run-url';

import { loadDeprovisionEnv, type TDeprovisionEnv } from './lib/env';
import { getTenantRow } from './lib/get-tenant-row';
import {
  reportDeprovisioningRunFinish,
  reportDeprovisioningRunStart,
} from './lib/report-deprovisioning-run';
import { reportDeprovisioningStepStatus } from './lib/report-deprovisioning-step-status';
import { archiveTenantSanityProject } from './steps/archive-sanity-project';
import { archiveTenantRow } from './steps/archive-tenant';
import { clearTenantArtifacts } from './steps/clear-artifacts';
import { invalidateTenantCache } from './steps/invalidate-tenant-cache';
import { removeTenantDomain } from './steps/remove-domain';
import { revokeTenantSanityTokens } from './steps/revoke-sanity-tokens';

const TENANT_ID_FLAG = '--tenant-id=';
const CONFIRM_FLAG = '--confirm=';
const DRY_RUN_FLAG = '--dry-run=';

function parseFlagValue(argv: string[], flag: string): string | undefined {
  return argv.find((arg) => arg.startsWith(flag))?.slice(flag.length);
}

function parseTenantId(argv: string[]): string {
  const value =
    parseFlagValue(argv, TENANT_ID_FLAG) ?? process.env['TENANT_ID'];
  if (!value) {
    throw new Error(
      'deprovision-tenant: missing required --tenant-id=<uuid> (or TENANT_ID env var).',
    );
  }
  return value;
}

function parseConfirm(argv: string[]): string {
  const value = parseFlagValue(argv, CONFIRM_FLAG) ?? process.env['CONFIRM'];
  if (!value) {
    throw new Error(
      'deprovision-tenant: missing required --confirm=<tenant-name> (or CONFIRM env var).',
    );
  }
  return value;
}

// Defaults to a dry run — an operator must explicitly pass `--dry-run=false`
// (or `DRY_RUN=false`) to perform real deletions.
function parseDryRun(argv: string[]): boolean {
  const value = parseFlagValue(argv, DRY_RUN_FLAG) ?? process.env['DRY_RUN'];
  return value !== 'false';
}

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
    key: DEPROVISIONING_STEP.ARCHIVE_SANITY_PROJECT,
    name: 'archive-sanity-project',
    run: archiveTenantSanityProject,
  },
  {
    key: DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS,
    name: 'revoke-sanity-tokens',
    run: revokeTenantSanityTokens,
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
    key: DEPROVISIONING_STEP.INVALIDATE_TENANT_CACHE,
    name: 'invalidate-tenant-cache',
    run: invalidateTenantCache,
  },
];

// recordStepStatus, recordRunStart and recordRunFinish each swallow their
// own error: a failure recording step/run state must never abort the
// teardown it is only trying to describe.
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
      ...(error === undefined ? {} : { error }),
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
      ...(runUrl === undefined ? {} : { workflowRunUrl: runUrl }),
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

// Exported for direct testing of the step sequencing without also exercising
// the confirmation guard, argv parsing, env loading, or the tenant-row fetch
// `main()` wraps it in.
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

      // Stop here — later steps stay untouched. Re-running the workflow for
      // the same tenant resumes at this step via its own idempotency check
      // — except invalidate-tenant-cache: once archive-tenant has run, the
      // top-level deprovisionedAt guard blocks any resumed run from ever
      // reaching it again, so retrying that one step alone goes through
      // `scripts/invalidate-tenant-cache/` instead.
      return { ok: false };
    }
  }

  if (env.dryRun === false) {
    await recordRunFinish(tenant.id);
  }

  return { ok: true };
}

export type TRunDeprovisioningResult = { ok: boolean; skipped?: true };

// Exported for direct testing of the confirmation/idempotency guard —
// the settled safety requirement this workflow exists to enforce — without
// exercising argv parsing, env loading, or the tenant-row fetch `main()`
// wraps it in.
export async function runDeprovisioning(
  tenant: TTenant,
  confirm: string,
  env: TDeprovisionEnv,
): Promise<TRunDeprovisioningResult> {
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
  const tenantId = parseTenantId(argv);
  const confirm = parseConfirm(argv);
  const dryRun = parseDryRun(argv);
  const env = loadDeprovisionEnv(dryRun);

  const tenant = await getTenantRow(tenantId);

  const { ok } = await runDeprovisioning(tenant, confirm, env);
  if (!ok) {
    process.exitCode = 1;
  }
}

// Only auto-run when this file is the CLI entrypoint (`tsx run.ts`) — guards
// against `main()` firing as an import side effect when a test imports
// `runSteps` from this same module.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error: unknown) => {
    console.error('deprovision-tenant: unexpected failure:', error);
    process.exitCode = 1;
  });
}
