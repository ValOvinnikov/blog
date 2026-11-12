import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import { sql } from 'drizzle-orm';
import { type AnyPgColumn, uniqueIndex } from 'drizzle-orm/pg-core';

export const SELF_SERVE_FREE_OWNER_INDEX_NAME =
  'tenants_self_serve_free_owner_idx';

type TSelfServeOwnerSlotColumns = {
  plan: AnyPgColumn;
  status: AnyPgColumn;
  selfServeOwnerEmailIndex: AnyPgColumn;
};

export function selfServeOwnerSlotIndex({
  plan,
  status,
  selfServeOwnerEmailIndex,
}: TSelfServeOwnerSlotColumns) {
  return uniqueIndex(SELF_SERVE_FREE_OWNER_INDEX_NAME)
    .on(selfServeOwnerEmailIndex)
    .where(
      sql`(${plan} = ${sql.raw(`'${TENANT_PLAN.FREE}'`)} or ${status} = ${sql.raw(`'${TENANT_STATUS.TRIAL}'`)}) and ${status} <> ${sql.raw(`'${TENANT_STATUS.ARCHIVED}'`)}`,
    );
}
