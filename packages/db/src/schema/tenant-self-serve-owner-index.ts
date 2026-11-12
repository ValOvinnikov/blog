import { TENANT_STATUS } from '@blog/db/constants';
import { sql } from 'drizzle-orm';
import { type AnyPgColumn, uniqueIndex } from 'drizzle-orm/pg-core';

export const SELF_SERVE_FREE_OWNER_INDEX_NAME =
  'tenants_self_serve_free_owner_idx';

type TSelfServeOwnerSlotColumns = {
  status: AnyPgColumn;
  selfServeOwnerEmailIndex: AnyPgColumn;
};

// The key is cleared when a site moves to paid, so a keyed, non-archived row is the owner's Free-or-trial slot whatever its plan or status.
export function selfServeOwnerSlotIndex({
  status,
  selfServeOwnerEmailIndex,
}: TSelfServeOwnerSlotColumns) {
  return uniqueIndex(SELF_SERVE_FREE_OWNER_INDEX_NAME)
    .on(selfServeOwnerEmailIndex)
    .where(
      sql`${selfServeOwnerEmailIndex} is not null and ${status} <> ${sql.raw(`'${TENANT_STATUS.ARCHIVED}'`)}`,
    );
}
