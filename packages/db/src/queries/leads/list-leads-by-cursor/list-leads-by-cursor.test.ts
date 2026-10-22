import { LEADS_PAGE_SIZE } from '@blog/db/constants/lead';
import * as schema from '@blog/db/schema';
import { insertTestLead, insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { eq, sql } from 'drizzle-orm';

import { listLeadsByCursor } from './list-leads-by-cursor';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const LEAD_COUNT = LEADS_PAGE_SIZE + 5;
const MINUTE_MS = 60_000;
const START = Date.UTC(2026, 0, 1);
const EARLIER_MICROSECOND = 'Earlier microsecond';
const LATER_MICROSECOND = 'Later microsecond';

function leadName(index: number) {
  return `Lead ${index}`;
}

async function insertLeadsOneMinuteApart(tenantId: string, count: number) {
  for (let index = 0; index < count; index += 1) {
    await insertTestLead(db(), tenantId, {
      name: leadName(index),
      createdAt: new Date(START + index * MINUTE_MS),
    });
  }
}

async function insertLeadAtExactTime(
  tenantId: string,
  name: string,
  createdAt: string,
) {
  const { id } = await insertTestLead(db(), tenantId, { name });
  await db()
    .update(schema.leads)
    .set({ createdAt: sql`${createdAt}::timestamptz` })
    .where(eq(schema.leads.id, id));
}

function newestFirstNames(count: number) {
  return Array.from({ length: count }, (_, index) =>
    leadName(count - 1 - index),
  );
}

afterEach(async () => {
  await db().delete(schema.leads);
  await db().delete(schema.tenants);
});

describe(listLeadsByCursor, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('returns no leads and no next cursor when the tenant has none', async () => {
    await expect(listLeadsByCursor({ tenantId })).resolves.toEqual({
      leads: [],
      nextCursor: undefined,
    });
  });

  it('pages through every lead once, newest first', async () => {
    await insertLeadsOneMinuteApart(tenantId, LEAD_COUNT);

    const first = await listLeadsByCursor({ tenantId });
    const second = await listLeadsByCursor({
      tenantId,
      after: first.nextCursor,
    });

    expect(first.leads).toHaveLength(LEADS_PAGE_SIZE);
    expect(second.nextCursor).toBeUndefined();
    expect([...first.leads, ...second.leads].map(({ name }) => name)).toEqual(
      newestFirstNames(LEAD_COUNT),
    );
  });

  it('neither repeats nor skips a lead when a new one arrives between calls', async () => {
    await insertLeadsOneMinuteApart(tenantId, LEAD_COUNT);
    const first = await listLeadsByCursor({ tenantId });

    await insertTestLead(db(), tenantId, {
      name: 'Arrived later',
      createdAt: new Date(START + LEAD_COUNT * MINUTE_MS),
    });
    const second = await listLeadsByCursor({
      tenantId,
      after: first.nextCursor,
    });

    expect([...first.leads, ...second.leads].map(({ name }) => name)).toEqual(
      newestFirstNames(LEAD_COUNT),
    );
  });

  it('pages leads created less than a millisecond apart without repeating one', async () => {
    await insertLeadsOneMinuteApart(tenantId, LEADS_PAGE_SIZE - 1);
    await insertLeadAtExactTime(
      tenantId,
      EARLIER_MICROSECOND,
      '2025-12-31 00:00:00.000100+00',
    );
    await insertLeadAtExactTime(
      tenantId,
      LATER_MICROSECOND,
      '2025-12-31 00:00:00.000200+00',
    );

    const first = await listLeadsByCursor({ tenantId });
    const second = await listLeadsByCursor({
      tenantId,
      after: first.nextCursor,
    });

    expect(first.leads.at(-1)?.name).toBe(LATER_MICROSECOND);
    expect(second.leads.map(({ name }) => name)).toEqual([EARLIER_MICROSECOND]);
  });

  it('orders leads created at the same moment by id, still listing each once', async () => {
    const createdAt = new Date(START);
    for (let index = 0; index < LEAD_COUNT; index += 1) {
      await insertTestLead(db(), tenantId, { createdAt });
    }

    const first = await listLeadsByCursor({ tenantId });
    const second = await listLeadsByCursor({
      tenantId,
      after: first.nextCursor,
    });

    const ids = [...first.leads, ...second.leads].map(({ id }) => id);
    expect(new Set(ids).size).toBe(LEAD_COUNT);
  });

  it("never returns another tenant's leads", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await insertTestLead(db(), tenantId, { name: 'Mine' });
    await insertTestLead(db(), otherTenantId, { name: 'Theirs' });

    const { leads } = await listLeadsByCursor({ tenantId });

    expect(leads.map(({ name }) => name)).toEqual(['Mine']);
  });
});
