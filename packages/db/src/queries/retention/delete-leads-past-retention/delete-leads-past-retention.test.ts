import { LEAD_RETENTION_MONTHS } from '@blog/db/constants';
import { monthsBefore } from '@blog/db/queries/retention/retention-cutoff';
import * as schema from '@blog/db/schema';
import { insertTestLead, insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  justPast,
  justWithin,
  MOCK_RETENTION_LIMIT,
  MOCK_RETENTION_NOW,
} from '@blog/db/testing/retention/fixtures';

import { deleteLeadsPastRetention } from './delete-leads-past-retention';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

const CUTOFF = monthsBefore(MOCK_RETENTION_NOW, LEAD_RETENTION_MONTHS);

afterEach(async () => {
  await db().delete(schema.leads);
  await db().delete(schema.tenants);
});

describe(deleteLeadsPastRetention, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('deletes the leads received before the period and keeps newer ones', async () => {
    await insertTestLead(db(), tenantId, { createdAt: justPast(CUTOFF) });
    const recent = await insertTestLead(db(), tenantId, {
      createdAt: justWithin(CUTOFF),
    });

    await expect(
      deleteLeadsPastRetention(MOCK_RETENTION_NOW, MOCK_RETENTION_LIMIT),
    ).resolves.toBe(1);

    const rows = await db().select({ id: schema.leads.id }).from(schema.leads);
    expect(rows).toEqual([{ id: recent.id }]);
  });

  it('deletes at most the given number of leads per call', async () => {
    await insertTestLead(db(), tenantId, { createdAt: justPast(CUTOFF) });
    await insertTestLead(db(), tenantId, { createdAt: justPast(CUTOFF) });

    await expect(deleteLeadsPastRetention(MOCK_RETENTION_NOW, 1)).resolves.toBe(
      1,
    );

    const rows = await db().select({ id: schema.leads.id }).from(schema.leads);
    expect(rows).toHaveLength(1);
  });

  it('deletes nothing when run a second time', async () => {
    await insertTestLead(db(), tenantId, { createdAt: justPast(CUTOFF) });
    await deleteLeadsPastRetention(MOCK_RETENTION_NOW, MOCK_RETENTION_LIMIT);

    await expect(
      deleteLeadsPastRetention(MOCK_RETENTION_NOW, MOCK_RETENTION_LIMIT),
    ).resolves.toBe(0);
  });
});
