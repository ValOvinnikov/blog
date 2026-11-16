import { SUSPENSION_CATEGORY } from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import type { TTenantSuspension } from '@shinefold/db/schema/tenant-suspensions';
import { firstRowOrThrow } from '@shinefold/db/testing/first-row-or-throw';
import type { TTestDb } from '@shinefold/db/testing/fixtures';
import { createMockFaker } from '@shinefold/db/testing/mock-faker';

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
