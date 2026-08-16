/**
 * Provisioning workflow entrypoint — runs the five independently-idempotent
 * steps in order for one tenant, reporting each step's status back to
 * `apps/admin`'s status-callback route both on success and failure.
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
} from '@blog/config/constants';
import type { TTenant } from '@blog/db/schema/tenants';

import { loadProvisionEnv, type TProvisionEnv } from './lib/env';
import { getTenantRow } from './lib/get-tenant-row';
import { sanitizeLogMessage } from './lib/sanitize-log-message';
import { reportStepStatus } from './lib/status-callback';
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
];

// Exported for direct testing of the step sequencing without also exercising
// argv parsing / env loading / the tenant-row fetch `main()` wraps it in.
export async function runSteps(
  tenantId: string,
  initialTenant: TTenant,
  env: TProvisionEnv,
): Promise<{ ok: boolean }> {
  let tenant = initialTenant;

  for (const step of STEPS) {
    await reportStepStatus({
      baseUrl: env.adminAppBaseUrl,
      secret: env.callbackSecret,
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
        baseUrl: env.adminAppBaseUrl,
        secret: env.callbackSecret,
        tenantId,
        step: step.key,
        status: TENANT_PROVISIONING_STEP_STATUS.DONE,
      });
    } catch (error) {
      const message = sanitizeLogMessage(error);
      console.error(`provision-tenant: step "${step.key}" failed: ${message}`);

      await reportStepStatus({
        baseUrl: env.adminAppBaseUrl,
        secret: env.callbackSecret,
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
  const tenant = await getTenantRow(tenantId);

  const { ok } = await runSteps(tenantId, tenant, env);
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
