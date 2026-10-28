import { LEADS_PAGE_SIZE } from '@blog/db/constants/lead';
import * as schema from '@blog/db/schema';
import {
  insertTestLead,
  insertTestTenant,
  MOCK_LEAD_EMAIL,
  MOCK_LEAD_MESSAGE,
  MOCK_LEAD_NAME,
} from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';
import { eq, sql } from 'drizzle-orm';

import { listLeadsByCursor } from './list-leads-by-cursor';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

const MOCK_LEAD_COUNT = LEADS_PAGE_SIZE + 5;
const MINUTE_MS = 60_000;
const MOCK_START = Date.UTC(2026, 0, 1);
const MOCK_EARLIER_MICROSECOND_AT = '2025-12-31 00:00:00.000100+00';
const MOCK_LATER_MICROSECOND_AT = '2025-12-31 00:00:00.000200+00';

faker.seed(6025);

const MOCK_EARLIER_MICROSECOND_NAME = faker.person.fullName();
const MOCK_LATER_MICROSECOND_NAME = faker.person.fullName();
const MOCK_LATE_LEAD_NAME = faker.person.fullName();
const MOCK_LEAD_NAMES = faker.helpers.uniqueArray(
  () => faker.person.fullName(),
  MOCK_LEAD_COUNT,
);

async function insertLeadsOneMinuteApart(tenantId: string, count: number) {
  for (let index = 0; index < count; index += 1) {
    await insertTestLead(db(), tenantId, {
      name: MOCK_LEAD_NAMES[index],
      createdAt: new Date(MOCK_START + index * MINUTE_MS),
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
  return MOCK_LEAD_NAMES.slice(0, count).reverse();
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
    const page = await listLeadsByCursor({ tenantId });

    expect(page).toEqual({ leads: [], nextCursor: undefined });
  });

  it('returns the name, email and message from their encrypted form', async () => {
    const { id, sourcePath, createdAt } = await insertTestLead(db(), tenantId);

    const { leads } = await listLeadsByCursor({ tenantId });

    expect(leads).toEqual([
      {
        id,
        name: MOCK_LEAD_NAME,
        email: MOCK_LEAD_EMAIL,
        message: MOCK_LEAD_MESSAGE,
        sourcePath,
        sourceDocumentId: null,
        sourceLocale: null,
        readAt: null,
        createdAt,
      },
    ]);
  });

  it('pages through every lead once, newest first', async () => {
    await insertLeadsOneMinuteApart(tenantId, MOCK_LEAD_COUNT);

    const first = await listLeadsByCursor({ tenantId });
    const second = await listLeadsByCursor({
      tenantId,
      after: first.nextCursor,
    });

    expect(first.leads).toHaveLength(LEADS_PAGE_SIZE);
    expect(second.nextCursor).toBeUndefined();
    expect([...first.leads, ...second.leads].map(({ name }) => name)).toEqual(
      newestFirstNames(MOCK_LEAD_COUNT),
    );
  });

  it('neither repeats nor skips a lead when a new one arrives between calls', async () => {
    await insertLeadsOneMinuteApart(tenantId, MOCK_LEAD_COUNT);
    const first = await listLeadsByCursor({ tenantId });

    await insertTestLead(db(), tenantId, {
      name: MOCK_LATE_LEAD_NAME,
      createdAt: new Date(MOCK_START + MOCK_LEAD_COUNT * MINUTE_MS),
    });
    const second = await listLeadsByCursor({
      tenantId,
      after: first.nextCursor,
    });

    expect([...first.leads, ...second.leads].map(({ name }) => name)).toEqual(
      newestFirstNames(MOCK_LEAD_COUNT),
    );
  });

  it('pages leads created less than a millisecond apart without repeating one', async () => {
    await insertLeadsOneMinuteApart(tenantId, LEADS_PAGE_SIZE - 1);
    await insertLeadAtExactTime(
      tenantId,
      MOCK_EARLIER_MICROSECOND_NAME,
      MOCK_EARLIER_MICROSECOND_AT,
    );
    await insertLeadAtExactTime(
      tenantId,
      MOCK_LATER_MICROSECOND_NAME,
      MOCK_LATER_MICROSECOND_AT,
    );

    const first = await listLeadsByCursor({ tenantId });
    const second = await listLeadsByCursor({
      tenantId,
      after: first.nextCursor,
    });

    expect(first.leads.at(-1)?.name).toBe(MOCK_LATER_MICROSECOND_NAME);
    expect(second.leads.map(({ name }) => name)).toEqual([
      MOCK_EARLIER_MICROSECOND_NAME,
    ]);
  });

  it('lists leads created at the same moment once each, highest id first', async () => {
    const createdAt = new Date(MOCK_START);
    const insertedIds: string[] = [];
    for (let index = 0; index < MOCK_LEAD_COUNT; index += 1) {
      const { id } = await insertTestLead(db(), tenantId, { createdAt });
      insertedIds.push(id);
    }

    const first = await listLeadsByCursor({ tenantId });
    const second = await listLeadsByCursor({
      tenantId,
      after: first.nextCursor,
    });

    const ids = [...first.leads, ...second.leads].map(({ id }) => id);
    expect(ids).toEqual([...insertedIds].sort().reverse());
  });

  it("never returns another tenant's leads", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    const mine = await insertTestLead(db(), tenantId);
    await insertTestLead(db(), otherTenantId);

    const { leads } = await listLeadsByCursor({ tenantId });

    expect(leads.map(({ id }) => id)).toEqual([mine.id]);
  });
});
