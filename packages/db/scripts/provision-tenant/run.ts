/**
 * Provisioning workflow entrypoint — runs the six independently-idempotent
 * steps in order for one tenant, writing each step's status directly to
 * Postgres (via `reportStepStatus`) both on success and failure.
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

import {
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantProvisioningStep,
} from '@blog/db/constants';
import { reactivateTenant } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { unarchiveSanityProject } from '@blog/db/utils/sanity-management-client/sanity-management-client';

import { loadProvisionEnv, type TProvisionEnv } from './lib/env';
import { reportStepStatus } from './lib/report-step-status';
import { sanitizeLogMessage } from './lib/sanitize-log-message';
import { createTenantRevalidateWebhook } from './steps/create-revalidate-webhook';
import { createTenantSanityProject } from './steps/create-sanity-project';
import { createTenantStudio } from './steps/create-studio-vercel-project';
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
  { key: TENANT_PROVISIONING_STEP.DEPLOY_STUDIO, run: createTenantStudio },
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
  // stays deprovisionable and slug-resolvable once this run succeeds — see
  // `reactivateTenant` for why a SUSPENDED tenant is left untouched.
  const reactivateResult = await reactivateTenant(tenantId);
  if (!reactivateResult.ok) {
    console.error(
      `provision-tenant: reactivateTenant failed for "${tenantId}" (${reactivateResult.error}).`,
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
      return { ok: false };
    }
  }

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

      // Stop here — later steps stay at whatever status they were already
      // in (idle, on a first run). The admin UI's per-step Retry button
      // re-dispatches this whole workflow, which resumes at this step via
      // its own idempotency check.
      return { ok: false };
    }
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
