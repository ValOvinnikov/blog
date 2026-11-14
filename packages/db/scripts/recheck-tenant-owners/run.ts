// Promotes each core-provisioned active tenant's owner to Sanity `administrator` once they have accepted their invite.
import { ELEVATE_TENANT_OWNER_OUTCOME } from '@blog/db/constants';
import { listTenantsPendingOwnerElevation } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { sanitizeLogMessage } from '@blog/insight';
import { isUndefined } from '@blog/utils/primitives';

import { runIfEntrypoint } from '../lib/run-if-entrypoint';

import { elevateTenantOwner } from './lib/elevate-tenant-owner';
import { loadRecheckEnv, type TRecheckEnv } from './lib/env';
import { notifyOwnerElevationOutcome } from './lib/notify-owner-elevation-outcome';
import { reportOwnerElevationOutcome } from './lib/report-owner-elevation-outcome';

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

async function recheckOne(
  tenant: TTenant,
  env: TRecheckEnv,
  summary: TRecheckSummary,
): Promise<void> {
  try {
    const outcome = await elevateTenantOwner(tenant, env);
    const notifiedOutcome = await notifyOwnerElevationOutcome({
      tenant,
      outcome,
    });
    await reportOwnerElevationOutcome(
      tenant.id,
      outcome,
      ...(isUndefined(notifiedOutcome) ? [] : [notifiedOutcome]),
    );

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
          `recheck-tenant-owners: tenant "${tenant.id}" ("${tenant.name}")'s owner still hasn't accepted their Sanity invite — administrator grant is stalled, not failed.`,
        );
        break;
      case ELEVATE_TENANT_OWNER_OUTCOME.AMBIGUOUS_MEMBERSHIP:
        summary.ambiguous += 1;
        console.error(
          `recheck-tenant-owners: tenant "${tenant.id}" ("${tenant.name}")'s Sanity project has more than one human member — cannot tell which is the owner, so no role was granted. Needs manual review.`,
        );
        break;
    }
  } catch (error) {
    summary.errors += 1;
    console.error(
      `recheck-tenant-owners: elevate-tenant-owner failed for tenant "${tenant.id}" ("${tenant.name}"): ${sanitizeLogMessage(error)}`,
    );
  }
}

export async function runRecheck(env: TRecheckEnv): Promise<TRecheckSummary> {
  const candidates = await listTenantsPendingOwnerElevation();
  const summary = emptySummary();
  summary.checked = candidates.length;

  for (const tenant of candidates) {
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

// `errors` counts only calls that threw — STALLED/PENDING_ACCEPTANCE/AMBIGUOUS_MEMBERSHIP outcomes are not failures.
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

runIfEntrypoint(import.meta.url, main, 'recheck-tenant-owners');
