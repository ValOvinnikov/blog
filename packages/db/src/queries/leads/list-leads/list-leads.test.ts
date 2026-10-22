import * as schema from '@blog/db/schema';
import {
  insertTestLead,
  insertTestTenant,
  TEST_LEAD_EMAIL,
  TEST_LEAD_MESSAGE,
  TEST_LEAD_NAME,
} from '@blog/db/testing/fixtures';
import { usePersonalDataKeys } from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { encryptPersonalValue } from '@blog/db/utils/personal-data/personal-data';

import { listLeads } from './list-leads';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);
usePersonalDataKeys();

const JANUARY_1 = new Date('2026-01-01T00:00:00Z');
const JANUARY_2 = new Date('2026-01-02T00:00:00Z');

async function insertEncryptedLead(
  tenantId: string,
  name: string,
  createdAt: Date,
): Promise<void> {
  await insertTestLead(db(), tenantId, {
    name,
    nameEncrypted: encryptPersonalValue(name),
    emailEncrypted: encryptPersonalValue(TEST_LEAD_EMAIL),
    messageEncrypted: encryptPersonalValue(TEST_LEAD_MESSAGE),
    createdAt,
  });
}

afterEach(async () => {
  await db().delete(schema.leads);
  await db().delete(schema.tenants);
});

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
    await insertEncryptedLead(tenantId, 'Oldest', JANUARY_1);
    await insertEncryptedLead(
      tenantId,
      'Newest',
      new Date('2026-03-01T00:00:00Z'),
    );
    await insertEncryptedLead(
      tenantId,
      'Middle',
      new Date('2026-02-01T00:00:00Z'),
    );

    const result = await listLeads({ tenantId, page: 1, pageSize: 10 });

    expect(result.leads.map(({ name }) => name)).toEqual([
      'Newest',
      'Middle',
      'Oldest',
    ]);
    expect(result.total).toBe(3);
  });

  it('pages through leads in order, keeping the full total on every page', async () => {
    await insertEncryptedLead(tenantId, 'First', JANUARY_1);
    await insertEncryptedLead(tenantId, 'Second', JANUARY_2);
    await insertEncryptedLead(
      tenantId,
      'Third',
      new Date('2026-01-03T00:00:00Z'),
    );

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
    await insertEncryptedLead(tenantId, 'Mine', JANUARY_1);
    await insertEncryptedLead(otherTenantId, 'Theirs', JANUARY_2);

    const result = await listLeads({ tenantId, page: 1, pageSize: 10 });

    expect(result.leads.map(({ name }) => name)).toEqual(['Mine']);
    expect(result.total).toBe(1);
  });

  it('returns the decrypted name, email and message rather than the plain columns', async () => {
    const lead = await insertTestLead(db(), tenantId, {
      name: 'stale plain name',
      nameEncrypted: encryptPersonalValue(TEST_LEAD_NAME),
      email: 'stale@example.com',
      emailEncrypted: encryptPersonalValue(TEST_LEAD_EMAIL),
      message: 'stale plain message',
      messageEncrypted: encryptPersonalValue(TEST_LEAD_MESSAGE),
      createdAt: JANUARY_1,
    });

    const result = await listLeads({ tenantId, page: 1, pageSize: 10 });

    expect(result.leads).toEqual([
      {
        id: lead.id,
        name: TEST_LEAD_NAME,
        email: TEST_LEAD_EMAIL,
        message: TEST_LEAD_MESSAGE,
        sourcePath: lead.sourcePath,
        createdAt: JANUARY_1,
      },
    ]);
  });

  it('throws when a lead has no encrypted form', async () => {
    await insertTestLead(db(), tenantId);

    await expect(
      listLeads({ tenantId, page: 1, pageSize: 10 }),
    ).rejects.toThrow('A personal value has no encrypted form.');
  });
});
