import { TENANT_STATUS } from '@blog/db/constants';
import { tenants } from '@blog/db/schema/tenants';
import { inArray, sql } from 'drizzle-orm';

const isAlreadyHeld = inArray(tenants.status, [
  TENANT_STATUS.SUSPENDED,
  TENANT_STATUS.ARCHIVED,
]);

// A suspension or archive keeps the status the tenant had before its first hold, so resuming restores it.
export function heldStatusFields() {
  return {
    statusBeforeHold: sql`case when ${isAlreadyHeld} then ${tenants.statusBeforeHold} else ${tenants.status} end`,
  };
}
