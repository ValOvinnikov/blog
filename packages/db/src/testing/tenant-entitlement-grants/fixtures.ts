import { CAPABILITY } from '@shinefold/config/constants';
import { ENTITLEMENT_KIND } from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import type { TTenantEntitlementGrant } from '@shinefold/db/schema/tenant-entitlement-grants';
import { firstRowOrThrow } from '@shinefold/db/testing/first-row-or-throw';
import { insertTestAdmin, type TTestDb } from '@shinefold/db/testing/fixtures';
import { MOCK_NOW } from '@shinefold/db/testing/frozen-clock';
import { createMockFaker } from '@shinefold/db/testing/mock-faker';

const grantsFaker = createMockFaker(678001);

export const MOCK_GRANT_NOTE = grantsFaker.lorem.sentence();
export const MOCK_GRANT_PAST = grantsFaker.date.past({ refDate: MOCK_NOW });
export const MOCK_GRANT_FUTURE = grantsFaker.date.future({ refDate: MOCK_NOW });

export async function insertTestEntitlementGrant(
  db: TTestDb,
  tenantId: string,
  overrides: Partial<typeof schema.tenantEntitlementGrants.$inferInsert> = {},
): Promise<TTenantEntitlementGrant> {
  return firstRowOrThrow(
    await db
      .insert(schema.tenantEntitlementGrants)
      .values({
        tenantId,
        kind: ENTITLEMENT_KIND.CAPABILITY,
        key: CAPABILITY.CONTACT_FORM,
        ...overrides,
      })
      .returning(),
    'insertTestEntitlementGrant',
  );
}

export function useEntitlementGrantAdmin(db: () => TTestDb): () => string {
  let adminId: string;

  beforeEach(async () => {
    ({ id: adminId } = await insertTestAdmin(db()));
  });

  afterEach(async () => {
    await db().delete(schema.tenantEntitlementGrants);
    await db().delete(schema.admins);
    await db().delete(schema.users);
  });

  return () => adminId;
}
