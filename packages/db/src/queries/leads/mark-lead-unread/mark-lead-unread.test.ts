import * as schema from '@blog/db/schema';
import { insertTestLead, insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { markLeadUnread } from './mark-lead-unread';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const READ_AT = new Date('2026-01-01T00:00:00Z');

afterEach(async () => {
  await db().delete(schema.leads);
  await db().delete(schema.tenants);
});

describe(markLeadUnread, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('marks a read lead unread and reports that it changed a lead', async () => {
    const { id } = await insertTestLead(db(), tenantId, { readAt: READ_AT });

    await expect(markLeadUnread({ tenantId, id })).resolves.toBe(true);

    const [row] = await db().select().from(schema.leads);
    expect(row?.readAt).toBeNull();
  });

  it('reports false when no lead has that id', async () => {
    await expect(
      markLeadUnread({ tenantId, id: '00000000-0000-0000-0000-000000000000' }),
    ).resolves.toBe(false);
  });

  it("never marks another tenant's lead unread", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    const { id } = await insertTestLead(db(), otherTenantId, {
      readAt: READ_AT,
    });

    await expect(markLeadUnread({ tenantId, id })).resolves.toBe(false);

    const [row] = await db().select().from(schema.leads);
    expect(row?.readAt).toEqual(READ_AT);
  });
});
