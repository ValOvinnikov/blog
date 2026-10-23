import * as schema from '@blog/db/schema';
import {
  MOCK_LEAD_READ_AT,
  insertTestLead,
  insertTestTenant,
} from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { markLeadRead } from './mark-lead-read';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.leads);
  await db().delete(schema.tenants);
});

describe(markLeadRead, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('marks an unread lead read and reports that it changed a lead', async () => {
    const { id } = await insertTestLead(db(), tenantId);

    await expect(markLeadRead({ tenantId, id })).resolves.toBe(true);

    const [row] = await db().select().from(schema.leads);
    expect(row?.readAt).toBeInstanceOf(Date);
  });

  it('keeps the time a lead was first read', async () => {
    const { id } = await insertTestLead(db(), tenantId, {
      readAt: MOCK_LEAD_READ_AT,
    });

    await expect(markLeadRead({ tenantId, id })).resolves.toBe(true);

    const [row] = await db().select().from(schema.leads);
    expect(row?.readAt).toEqual(MOCK_LEAD_READ_AT);
  });

  it('reports false when no lead has that id', async () => {
    await expect(
      markLeadRead({ tenantId, id: faker.string.uuid() }),
    ).resolves.toBe(false);
  });

  it("never marks another tenant's lead read", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    const { id } = await insertTestLead(db(), otherTenantId);

    await expect(markLeadRead({ tenantId, id })).resolves.toBe(false);

    const [row] = await db().select().from(schema.leads);
    expect(row?.readAt).toBeNull();
  });
});
