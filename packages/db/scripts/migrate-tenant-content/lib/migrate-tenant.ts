import { join } from 'node:path';

import { TENANT_STATUS } from '@blog/db/constants';
import {
  clearTenantContentMigrationFailure,
  getTenantSanityWriteCredentials,
  recordTenantContentMigrationFailure,
  type TTenantSanityWriteCredentials,
} from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { sanitizeLogMessage } from '@blog/insight';

import { isTenantMigrationLedgerEmpty } from './read-tenant-migration-ledger';
import {
  exportTenantDataset,
  runTenantMigrationDeploy,
} from './run-tenant-migrate-script';

export type TMigrateSummary = {
  checked: number;
  migrated: number;
  backfilled: number;
  skipped: number;
  errors: number;
};

export function emptySummary(): TMigrateSummary {
  return { checked: 0, migrated: 0, backfilled: 0, skipped: 0, errors: 0 };
}

async function updateFailureRecord(
  tenantId: string,
  update: () => Promise<void>,
): Promise<void> {
  try {
    await update();
  } catch (error) {
    console.error(
      `migrate-tenant-content: could not update the content migration failure record for tenant "${tenantId}": ${sanitizeLogMessage(error)}`,
    );
  }
}

function deployTenant(
  tenant: TTenant,
  credentials: TTenantSanityWriteCredentials,
): boolean {
  const exportDir = process.env['TENANT_EXPORT_DIR'];
  if (exportDir) {
    console.log(
      `migrate-tenant-content: exporting tenant "${tenant.id}" dataset before migrating it.`,
    );
    exportTenantDataset(credentials, join(exportDir, `${tenant.id}.tar.gz`));
  }

  const backfill = isTenantMigrationLedgerEmpty(credentials);
  if (backfill) {
    console.log(
      `migrate-tenant-content: tenant "${tenant.id}" has an empty migration ledger — backfilling instead of replaying history.`,
    );
  }

  console.log(
    `migrate-tenant-content: running ${backfill ? 'backfill' : 'deploy'} for tenant "${tenant.id}" (project "${credentials.projectId}", dataset "${credentials.dataset}").`,
  );
  runTenantMigrationDeploy({ ...credentials, backfill });

  return backfill;
}

export async function migrateTenant(
  tenant: TTenant,
  summary: TMigrateSummary,
): Promise<void> {
  const credentials = await getTenantSanityWriteCredentials(tenant.id);
  if (!credentials) {
    summary.skipped += 1;
    return;
  }

  if (
    credentials.status !== TENANT_STATUS.ACTIVE ||
    credentials.deprovisionedAt
  ) {
    summary.skipped += 1;
    console.log(
      `migrate-tenant-content: skipping tenant "${tenant.id}" — status="${credentials.status}" deprovisionedAt=${credentials.deprovisionedAt ? credentials.deprovisionedAt.toISOString() : 'null'}`,
    );
    return;
  }

  let backfill: boolean;
  try {
    backfill = deployTenant(tenant, credentials);
  } catch (error) {
    summary.errors += 1;
    console.error(
      `migrate-tenant-content: migration deploy failed for tenant "${tenant.id}": ${sanitizeLogMessage(error)}`,
    );
    await updateFailureRecord(tenant.id, () =>
      recordTenantContentMigrationFailure(tenant.id, new Date()),
    );
    return;
  }

  if (backfill) {
    summary.backfilled += 1;
  } else {
    summary.migrated += 1;
  }

  if (tenant.contentMigrationFailedAt) {
    await updateFailureRecord(tenant.id, () =>
      clearTenantContentMigrationFailure(tenant.id),
    );
  }
}
