// Manual, human-run only: never wire it into CI or a deploy pipeline.
import { pathToFileURL } from 'node:url';

import { TENANT_PROVISIONING_STATUS } from '@blog/db/constants';
import {
  listTenantsWedgedInProvisioning,
  setTenantProvisioningStatus,
} from '@blog/db/queries/tenants';

import { parseDryRun } from './lib/cli-flags';

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
  const dryRun = parseDryRun(process.argv.slice(2));
  const count = await recoverWedgedTenants(dryRun);

  console.warn(
    `recover-wedged-provisioning: ${count} wedged tenant(s) ${dryRun ? 'found' : 'settled'}.`,
  );
}

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
