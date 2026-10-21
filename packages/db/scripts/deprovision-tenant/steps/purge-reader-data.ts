import {
  countTenantReaderData,
  purgeTenantReaderData as purgeReaderDataRows,
  type TTenantReaderDataCounts,
} from '@blog/db/queries/reader-data';
import type { TTenant } from '@blog/db/schema/tenants';

import type { TDeprovisionEnv } from '../lib/env';
import { recordReaderDataPurgeAuditEvent } from '../lib/record-reader-data-purge-audit-event';

function describeCounts({
  subscribers,
  bookmarks,
  membershipInvites,
  leads,
}: TTenantReaderDataCounts): string {
  return `${subscribers} subscriber(s), ${bookmarks} bookmark(s), ${membershipInvites} membership invite(s), ${leads} lead(s)`;
}

export async function purgeTenantReaderData(
  tenant: TTenant,
  env: TDeprovisionEnv,
): Promise<void> {
  if (env.dryRun) {
    const counts = await countTenantReaderData(tenant.id);
    console.warn(
      `[dry-run] would purge reader data for tenant "${tenant.id}": ${describeCounts(counts)}.`,
    );
    return;
  }

  const counts = await purgeReaderDataRows(tenant.id);
  console.warn(
    `deprovision-tenant: purged reader data for tenant "${tenant.id}": ${describeCounts(counts)}.`,
  );

  await recordReaderDataPurgeAuditEvent(tenant.id, env, counts);
}
