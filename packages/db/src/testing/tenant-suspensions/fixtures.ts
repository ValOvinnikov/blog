import { SUSPENSION_CATEGORY } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import type { TTenantSuspension } from '@blog/db/schema/tenant-suspensions';
import { firstRowOrThrow } from '@blog/db/testing/first-row-or-throw';
import type { TTestDb } from '@blog/db/testing/fixtures';
import { createMockFaker } from '@blog/db/testing/mock-faker';

const suspensionsFaker = createMockFaker(659001);

export const MOCK_SUSPENSION_DESCRIPTION = suspensionsFaker.lorem.sentence();

export const MOCK_SUSPENSION_REFERENCE_PATTERN = /^SUS-\d{6}$/;

export async function insertTestTenantSuspension(
  db: TTestDb,
  tenantId: string,
  overrides: Partial<typeof schema.tenantSuspensions.$inferInsert> = {},
): Promise<TTenantSuspension> {
  return firstRowOrThrow(
    await db
      .insert(schema.tenantSuspensions)
      .values({
        tenantId,
        category: SUSPENSION_CATEGORY.ABUSE,
        description: MOCK_SUSPENSION_DESCRIPTION,
        ...overrides,
      })
      .returning(),
    'insertTestTenantSuspension',
  );
}

export function toReferenceNumber({ reference }: TTenantSuspension): number {
  return Number(reference.slice(reference.indexOf('-') + 1));
}
