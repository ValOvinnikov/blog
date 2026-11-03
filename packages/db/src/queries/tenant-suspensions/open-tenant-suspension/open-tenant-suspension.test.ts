import { SUSPENSION_CATEGORY } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestAdmin, insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  insertTestTenantSuspension,
  MOCK_SUSPENSION_DESCRIPTION,
  MOCK_SUSPENSION_REFERENCE_PATTERN,
  toReferenceNumber,
} from '@blog/db/testing/tenant-suspensions/fixtures';
import { eq } from 'drizzle-orm';

import { openTenantSuspension } from './open-tenant-suspension';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

let suspendedBy: string;

beforeEach(async () => {
  ({ id: suspendedBy } = await insertTestAdmin(db()));
});

afterEach(async () => {
  await db().delete(schema.tenantSuspensions);
  await db().delete(schema.tenants);
  await db().delete(schema.admins);
  await db().delete(schema.users);
});

async function openFor(tenantId: string) {
  return openTenantSuspension({
    tenantId,
    category: SUSPENSION_CATEGORY.TERMS_VIOLATION,
    description: MOCK_SUSPENSION_DESCRIPTION,
    suspendedBy,
  });
}

describe(openTenantSuspension, () => {
  it('opens a case under a SUS- reference', async () => {
    const { id: tenantId } = await insertTestTenant(db());

    const suspension = await openFor(tenantId);

    expect(suspension).toMatchObject({
      tenantId,
      category: SUSPENSION_CATEGORY.TERMS_VIOLATION,
      description: MOCK_SUSPENSION_DESCRIPTION,
      suspendedBy,
      liftedAt: null,
    });
    expect(suspension.reference).toMatch(MOCK_SUSPENSION_REFERENCE_PATTERN);
  });

  it('numbers references sequentially across tenants', async () => {
    const first = await insertTestTenant(db());
    const second = await insertTestTenant(db());

    const firstCase = await openFor(first.id);
    const secondCase = await openFor(second.id);

    expect(toReferenceNumber(secondCase)).toBe(
      toReferenceNumber(firstCase) + 1,
    );
  });

  it('gives a second suspension of the same tenant a new reference', async () => {
    const { id: tenantId } = await insertTestTenant(db());
    const earlier = await insertTestTenantSuspension(db(), tenantId, {
      liftedAt: new Date(),
    });

    const later = await openFor(tenantId);

    expect(later.reference).not.toBe(earlier.reference);
  });

  it('refuses a second open case for the same tenant', async () => {
    const { id: tenantId } = await insertTestTenant(db());
    await openFor(tenantId);

    await expect(openFor(tenantId)).rejects.toThrow();

    const rows = await db()
      .select()
      .from(schema.tenantSuspensions)
      .where(eq(schema.tenantSuspensions.tenantId, tenantId));
    expect(rows).toHaveLength(1);
  });
});
