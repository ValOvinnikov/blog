/**
 * Owner-elevation sweep entrypoint — periodically re-checks every fully
 * core-provisioned, active tenant's Sanity project ACL and promotes its
 * owner from `viewer` to `administrator` once they've accepted their
 * invite (see `elevateTenantOwner`). `provision-tenant/run.ts` also calls
 * `elevateTenantOwner` once, right after core provisioning, but a human
 * owner routinely accepts their invite well after that single check — this
 * sweep is the recurring re-check that single run can't provide.
 *
 * Invoked only by `.github/workflows/recheck-tenant-owners.yml` via
 * `pnpm --filter @blog/db db:recheck-tenant-owners` — never run by hand
 * against a shared/production tenant registry outside that workflow.
 *
 * `--conditions=react-server` makes `getDb()`'s `import 'server-only'`
 * resolve to a no-op outside Next.js's own build, same trick
 * `provision-tenant/run.ts` relies on.
 */
import { pathToFileURL } from 'node:url';

import {
  ELEVATE_TENANT_OWNER_OUTCOME,
  TENANT_PROVISIONING_STEP,
} from '@blog/db/constants';
import { listTenantsPendingOwnerElevation } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { sanitizeLogMessage } from '@blog/insight';

import { reportOwnerElevationOutcome } from '../provision-tenant/lib/report-owner-elevation-outcome';
import { elevateTenantOwner } from '../provision-tenant/steps/elevate-tenant-owner';

import { loadRecheckEnv, type TRecheckEnv } from './lib/env';
import {
  isNotifiableOutcome,
  notifyOperatorsOfOwnerElevationOutcome,
} from './lib/notify-operators';

export type TRecheckSummary = {
  checked: number;
  elevated: number;
  alreadyAdministrator: number;
  pendingAcceptance: number;
  stalled: number;
  ambiguous: number;
  errors: number;
};

function emptySummary(): TRecheckSummary {
  return {
    checked: 0,
    elevated: 0,
    alreadyAdministrator: 0,
    pendingAcceptance: 0,
    stalled: 0,
    ambiguous: 0,
    errors: 0,
  };
}

// `elevateTenantOwner`'s second parameter is nominally typed to the much
// larger `TProvisionEnv` (Vercel/domain/webhook fields this sweep has no
// use for), even though it only ever reads `sanityManagementToken` off it.
// Deriving the parameter type structurally — rather than importing
// `TProvisionEnv` itself — keeps this cast honest about exactly what's
// being widened, without pulling in provisioning's full env surface.
type TElevateTenantOwnerEnv = Parameters<typeof elevateTenantOwner>[1];

async function recheckOne(
  tenant: TTenant,
  env: TRecheckEnv,
  summary: TRecheckSummary,
): Promise<void> {
  try {
    const previousOutcome =
      tenant.provisioningSteps?.[TENANT_PROVISIONING_STEP.OWNER_ELEVATION]
        ?.detail;
    const outcome = await elevateTenantOwner(
      tenant,
      env as TElevateTenantOwnerEnv,
    );
    await reportOwnerElevationOutcome(tenant.id, outcome);

    if (isNotifiableOutcome(outcome) && outcome !== previousOutcome) {
      await notifyOperatorsOfOwnerElevationOutcome({
        tenant,
        outcome,
        resendApiKey: env.resendApiKey,
      });
    }

    switch (outcome) {
      case ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED:
        summary.elevated += 1;
        break;
      case ELEVATE_TENANT_OWNER_OUTCOME.ALREADY_ADMINISTRATOR:
        summary.alreadyAdministrator += 1;
        break;
      case ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE:
        summary.pendingAcceptance += 1;
        break;
      case ELEVATE_TENANT_OWNER_OUTCOME.STALLED:
        summary.stalled += 1;
        console.error(
          `recheck-tenant-owners: tenant "${tenant.id}" (slug "${tenant.slug}")'s owner still hasn't accepted their Sanity invite — administrator grant is stalled, not failed.`,
        );
        break;
      case ELEVATE_TENANT_OWNER_OUTCOME.AMBIGUOUS_MEMBERSHIP:
        summary.ambiguous += 1;
        console.error(
          `recheck-tenant-owners: tenant "${tenant.id}" (slug "${tenant.slug}")'s Sanity project has more than one human member — cannot tell which is the owner, so no role was granted. Needs manual review.`,
        );
        break;
    }
  } catch (error) {
    summary.errors += 1;
    console.error(
      `recheck-tenant-owners: elevate-tenant-owner failed for tenant "${tenant.id}" (slug "${tenant.slug}"): ${sanitizeLogMessage(error)}`,
    );
  }
}

// Exported for direct testing of the sweep logic without also exercising
// env loading.
export async function runRecheck(env: TRecheckEnv): Promise<TRecheckSummary> {
  const candidates = await listTenantsPendingOwnerElevation();
  const summary = emptySummary();
  summary.checked = candidates.length;

  for (const tenant of candidates) {
    // Each tenant is independent — one tenant's network/API failure must
    // never abort the sweep for the rest.
    await recheckOne(tenant, env, summary);
  }

  console.log(
    `recheck-tenant-owners: checked ${summary.checked} tenant(s) — ` +
      `elevated=${summary.elevated} alreadyAdministrator=${summary.alreadyAdministrator} ` +
      `pendingAcceptance=${summary.pendingAcceptance} stalled=${summary.stalled} ` +
      `ambiguous=${summary.ambiguous} errors=${summary.errors}`,
  );

  return summary;
}

// Exported for direct testing of the exit-code decision without also
// exercising env loading or the sweep itself. `errors` means the per-tenant
// call itself threw (e.g. a network/API failure) — the expected
// STALLED/PENDING_ACCEPTANCE/AMBIGUOUS_MEMBERSHIP outcomes never count
// here, since `recheckOne` already tallies those separately and they are
// not failures.
export function hasSystemicFailures(summary: TRecheckSummary): boolean {
  return summary.errors > 0;
}

async function main(): Promise<void> {
  const env = loadRecheckEnv();
  const summary = await runRecheck(env);
  if (hasSystemicFailures(summary)) {
    process.exitCode = 1;
  }
}

// Only auto-run when this file is the CLI entrypoint (`tsx run.ts`) — guards
// against `main()` firing as an import side effect when a test imports
// `runRecheck` from this same module.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error: unknown) => {
    console.error('recheck-tenant-owners: unexpected failure:', error);
    process.exitCode = 1;
  });
}
