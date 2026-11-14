// Manual, human-run only (`--dry-run` lists without writing): moves tenants wedged at PROVISIONING after a FAILED step to FAILED, so a normal Retry re-dispatches them.
import { TENANT_PROVISIONING_STATUS } from '@blog/db/constants';
import {
  listTenantsWedgedInProvisioning,
  setTenantProvisioningStatus,
} from '@blog/db/queries/tenants';

import { hasDryRunFlag } from './lib/dry-run-flag';
import { runIfEntrypoint } from './lib/run-if-entrypoint';

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
  const dryRun = hasDryRunFlag(process.argv);
  const count = await recoverWedgedTenants(dryRun);

  console.warn(
    `recover-wedged-provisioning: ${count} wedged tenant(s) ${dryRun ? 'found' : 'settled'}.`,
  );
}

runIfEntrypoint(import.meta.url, main);
