/**
 * Provisioning workflow entrypoint — runs the five independently-idempotent
 * steps in order for one tenant, writing each step's status directly to
 * Postgres (via `reportStepStatus`) both on success and failure, then
 * best-effort seeds default email-template copy
 * (`seedEmailTemplateDefaults`) and attempts to elevate the owner to Sanity
 * `administrator` (see `elevateTenantOwner`) — neither affects this run's own
 * result: an owner who hasn't yet accepted their invite never fails it, since
 * that step polls a live external event with no fixed timeline, and a
 * missing template row already falls back to product defaults on every read.
 *
 * Invoked only by `.github/workflows/provision-tenant.yml` via
 * `pnpm --filter @blog/db db:provision-tenant -- --tenant-id=<uuid>` — never
 * run by hand against a shared/production tenant outside that workflow.
 *
 * `--conditions=react-server` makes `getDb()`'s `import 'server-only'`
 * resolve to a no-op outside Next.js's own build, same trick
 * `scripts/seed-tenant.ts` relies on.
 */
import { pathToFileURL } from 'node:url';

import { AUDIT_ACTION } from '@blog/config/constants';
import {
  ELEVATE_TENANT_OWNER_OUTCOME,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantProvisioningStep,
} from '@blog/db/constants';
import { seedEmailTemplateDefaults } from '@blog/db/queries/email-templates';
import { reactivateTenant } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { unarchiveSanityProject } from '@blog/db/utils/sanity-management-client/sanity-management-client';
import { sanitizeLogMessage } from '@blog/insight';

import { loadProvisionEnv, type TProvisionEnv } from './lib/env';
import { notifyOwnerElevationOutcome } from './lib/notify-owner-elevation-outcome';
import { recordProvisioningAuditEvent } from './lib/record-provisioning-audit-event';
import { reportOwnerElevationOutcome } from './lib/report-owner-elevation-outcome';
import {
  reportProvisioningRunFinish,
  reportProvisioningRunStart,
} from './lib/report-provisioning-run';
import { reportStepStatus } from './lib/report-step-status';
import { workflowRunUrl } from './lib/workflow-run-url/workflow-run-url';
import { createTenantRevalidateWebhook } from './steps/create-revalidate-webhook';
import { createTenantSanityProject } from './steps/create-sanity-project';
import { elevateTenantOwner } from './steps/elevate-tenant-owner';
import { mapTenantDomain } from './steps/map-domain';
import { persistTenantSanityToken } from './steps/persist-sanity-token';
import { seedTenantContent } from './steps/seed-content';

const TENANT_ID_FLAG = '--tenant-id=';

function parseTenantId(argv: string[]): string {
  const flag = argv.find((arg) => arg.startsWith(TENANT_ID_FLAG));
  const value = flag?.slice(TENANT_ID_FLAG.length) ?? process.env['TENANT_ID'];
  if (!value) {
    throw new Error(
      'provision-tenant: missing required --tenant-id=<uuid> (or TENANT_ID env var).',
    );
  }
  return value;
}

type TStep = {
  key: TTenantProvisioningStep;
  run: (
    tenant: TTenant,
    env: TProvisionEnv,
  ) => Promise<Partial<TTenant> | void>;
};

const STEPS: TStep[] = [
  {
    key: TENANT_PROVISIONING_STEP.SANITY_PROJECT,
    run: createTenantSanityProject,
  },
  { key: TENANT_PROVISIONING_STEP.SEED_CONTENT, run: seedTenantContent },
  {
    key: TENANT_PROVISIONING_STEP.PERSIST_TOKEN,
    run: persistTenantSanityToken,
  },
  { key: TENANT_PROVISIONING_STEP.MAP_DOMAIN, run: mapTenantDomain },
  {
    key: TENANT_PROVISIONING_STEP.CREATE_WEBHOOK,
    run: createTenantRevalidateWebhook,
  },
];

// Exported for direct testing of the step sequencing without also exercising
// argv parsing / env loading.
export async function runSteps(
  tenantId: string,
  env: TProvisionEnv,
): Promise<{ ok: boolean }> {
  // Reactivates a re-provisioned tenant's row before any step runs, so it
  // stays deprovisionable once this run succeeds — see `reactivateTenant`
  // for why a SUSPENDED tenant is left untouched.
  const reactivateResult = await reactivateTenant(tenantId);
  if (!reactivateResult.ok) {
    console.error(
      `provision-tenant: reactivateTenant failed for "${tenantId}" (${reactivateResult.error}).`,
    );
    await recordProvisioningAuditEvent(
      tenantId,
      env,
      AUDIT_ACTION.PROVISIONING_FAILED,
    );
    return { ok: false };
  }

  let tenant = reactivateResult.data;

  // A re-provisioned tenant already has a `sanityProjectId` from its first
  // run — deprovisioning archived that project (blocking its API/CDN
  // access) rather than deleting it, so without this the tenant row now
  // reads ACTIVE while its content API is still blocked. Idempotent, and a
  // no-op for a first-time provision (no project yet).
  if (tenant.sanityProjectId) {
    try {
      await unarchiveSanityProject({
        token: env.sanityManagementToken,
        projectId: tenant.sanityProjectId,
      });
    } catch (error) {
      console.error(
        `provision-tenant: failed to un-archive Sanity project "${tenant.sanityProjectId}" for tenant "${tenantId}": ${sanitizeLogMessage(error)}`,
      );
      await recordProvisioningAuditEvent(
        tenantId,
        env,
        AUDIT_ACTION.PROVISIONING_FAILED,
      );
      return { ok: false };
    }
  }

  const runUrl = workflowRunUrl({
    serverUrl: env.githubServerUrl,
    repository: env.githubRepository,
    runId: env.githubRunId,
  });

  await reportProvisioningRunStart({
    tenantId,
    ...(env.tenantRegistryEnvironment === undefined
      ? {}
      : { registry: env.tenantRegistryEnvironment }),
    ...(runUrl === undefined ? {} : { workflowRunUrl: runUrl }),
  });

  for (const step of STEPS) {
    await reportStepStatus({
      tenantId,
      step: step.key,
      status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
    });

    try {
      const result = await step.run(tenant, env);
      if (result) {
        tenant = { ...tenant, ...result };
      }

      await reportStepStatus({
        tenantId,
        step: step.key,
        status: TENANT_PROVISIONING_STEP_STATUS.DONE,
      });
    } catch (error) {
      const message = sanitizeLogMessage(error);
      console.error(`provision-tenant: step "${step.key}" failed: ${message}`);

      await reportStepStatus({
        tenantId,
        step: step.key,
        status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
        error: message,
      });

      await reportProvisioningRunFinish(tenantId);
      await recordProvisioningAuditEvent(
        tenantId,
        env,
        AUDIT_ACTION.PROVISIONING_FAILED,
        step.key,
      );

      // Stop here — later steps stay at whatever status they were already
      // in (idle, on a first run). The admin UI's per-step Retry button
      // re-dispatches this whole workflow, which resumes at this step via
      // its own idempotency check.
      return { ok: false };
    }
  }

  await reportProvisioningRunFinish(tenantId);
  await recordProvisioningAuditEvent(tenantId, env, AUDIT_ACTION.PROVISIONED);

  // Best-effort — a missing row falls back to `EMAIL_TEMPLATE_DEFAULT_COPY`
  // per field on every read, so a seeding failure never affects this run's
  // own result.
  try {
    await seedEmailTemplateDefaults(tenantId);
  } catch (error) {
    console.error(
      `provision-tenant: seedEmailTemplateDefaults failed for tenant "${tenantId}": ${sanitizeLogMessage(error)}`,
    );
  }

  // Runs only once the tenant is fully provisioned and never affects this
  // run's own result — the owner accepting their invite is outside this
  // script's control, so PENDING_ACCEPTANCE/STALLED are expected, common
  // outcomes, not failures.
  try {
    const outcome = await elevateTenantOwner(tenant, env);
    const notifiedOutcome = await notifyOwnerElevationOutcome({
      tenant,
      outcome,
    });
    await reportOwnerElevationOutcome(
      tenantId,
      outcome,
      ...(notifiedOutcome === undefined ? [] : [notifiedOutcome]),
    );

    if (outcome === ELEVATE_TENANT_OWNER_OUTCOME.STALLED) {
      console.error(
        `provision-tenant: tenant "${tenantId}"'s owner still hasn't accepted their Sanity invite — administrator grant is stalled, not failed.`,
      );
    } else if (outcome === ELEVATE_TENANT_OWNER_OUTCOME.AMBIGUOUS_MEMBERSHIP) {
      console.error(
        `provision-tenant: tenant "${tenantId}"'s Sanity project has more than one human member — cannot tell which is the owner, so no role was granted. Needs manual review.`,
      );
    }
  } catch (error) {
    console.error(
      `provision-tenant: elevate-tenant-owner failed for tenant "${tenantId}": ${sanitizeLogMessage(error)}`,
    );
  }

  return { ok: true };
}

async function main(): Promise<void> {
  const tenantId = parseTenantId(process.argv.slice(2));
  const env = loadProvisionEnv();

  const { ok } = await runSteps(tenantId, env);
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
    console.error('provision-tenant: unexpected failure:', error);
    process.exitCode = 1;
  });
}
