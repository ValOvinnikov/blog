/**
 * Settles every tenant stuck at `provisioningStatus: PROVISIONING` despite
 * one of its steps recording FAILED — a state `beginTenantProvisioning`'s
 * retry guard cannot get a wedged row out of on its own, since the guard
 * only admits a row that is NULL or not PROVISIONING. Moves each one to
 * FAILED, from which a normal Retry re-dispatches it.
 *
 * MANUAL, HUMAN-RUN ONLY — never wired into CI or any deploy pipeline. Run
 * it by hand, once, against the target Neon branch:
 *
 *   set -a && source apps/web/.env.local && set +a
 *   pnpm --filter @blog/db db:recover-wedged-provisioning -- --dry-run
 *   pnpm --filter @blog/db db:recover-wedged-provisioning
 *
 * `--dry-run` lists the affected tenant ids without writing; omit it to
 * apply. Idempotent: re-running finds nothing once every wedged tenant has
 * been settled.
 */
import { pathToFileURL } from 'node:url';

import { TENANT_PROVISIONING_STATUS } from '@blog/db/constants';
import {
  listTenantsWedgedInProvisioning,
  setTenantProvisioningStatus,
} from '@blog/db/queries/tenants';

// Exported for direct testing of the recovery logic without also exercising
// argv parsing.
export async function recoverWedgedTenants(dryRun: boolean): Promise<number> {
  const wedged = await listTenantsWedgedInProvisioning();

  for (const tenant of wedged) {
    console.warn(
      `recover-wedged-provisioning: ${dryRun ? 'would settle' : 'settling'} tenant "${tenant.id}" (${tenant.primaryDomain}) to FAILED.`,
    );

    if (!dryRun) {
      await setTenantProvisioningStatus(
        tenant.id,
        TENANT_PROVISIONING_STATUS.FAILED,
      );
    }
  }

  return wedged.length;
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const count = await recoverWedgedTenants(dryRun);

  console.warn(
    `recover-wedged-provisioning: ${count} wedged tenant(s) ${dryRun ? 'found' : 'settled'}.`,
  );
}

// Only auto-run when this file is the CLI entrypoint (`tsx
// recover-wedged-provisioning.ts`) — guards against `main()` firing as an
// import side effect when a test imports `recoverWedgedTenants` from this
// same module.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main()
    .then(() => process.exit(0))
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}
