import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { listLeads } from './list-leads';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.leads);
  await db().delete(schema.tenants);
});

async function seedLead(tenantId: string, name: string, createdAt: Date) {
  await db().insert(schema.leads).values({
    tenantId,
    name,
    email: 'reader@example.com',
    message: 'Hello there, this is a message.',
    sourcePath: '/en/contact',
    createdAt,
  });
}

describe(listLeads, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('returns an empty page and a zero total when the tenant has no leads', async () => {
    const result = await listLeads({ tenantId, page: 1, pageSize: 10 });

    expect(result).toEqual({ leads: [], total: 0 });
  });

  it('lists leads newest first with the total', async () => {
    await seedLead(tenantId, 'Oldest', new Date('2026-01-01T00:00:00Z'));
    await seedLead(tenantId, 'Newest', new Date('2026-03-01T00:00:00Z'));
    await seedLead(tenantId, 'Middle', new Date('2026-02-01T00:00:00Z'));

    const result = await listLeads({ tenantId, page: 1, pageSize: 10 });

    expect(result.leads.map(({ name }) => name)).toEqual([
      'Newest',
      'Middle',
      'Oldest',
    ]);
    expect(result.total).toBe(3);
  });

  it('pages through leads in order, keeping the full total on every page', async () => {
    await seedLead(tenantId, 'First', new Date('2026-01-01T00:00:00Z'));
    await seedLead(tenantId, 'Second', new Date('2026-01-02T00:00:00Z'));
    await seedLead(tenantId, 'Third', new Date('2026-01-03T00:00:00Z'));

    const firstPage = await listLeads({ tenantId, page: 1, pageSize: 2 });
    const secondPage = await listLeads({ tenantId, page: 2, pageSize: 2 });

    expect(firstPage.leads.map(({ name }) => name)).toEqual([
      'Third',
      'Second',
    ]);
    expect(secondPage.leads.map(({ name }) => name)).toEqual(['First']);
    expect(firstPage.total).toBe(3);
    expect(secondPage.total).toBe(3);
  });

  it("never returns another tenant's leads", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await seedLead(tenantId, 'Mine', new Date('2026-01-01T00:00:00Z'));
    await seedLead(otherTenantId, 'Theirs', new Date('2026-01-02T00:00:00Z'));

    const result = await listLeads({ tenantId, page: 1, pageSize: 10 });

    expect(result.leads.map(({ name }) => name)).toEqual(['Mine']);
    expect(result.total).toBe(1);
  });
});
