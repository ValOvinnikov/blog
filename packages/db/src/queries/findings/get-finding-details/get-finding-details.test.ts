import {
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
} from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { openFinding } from '../open-finding';

import { getFindingDetails } from './get-finding-details';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.findings);
  await db().delete(schema.tenants);
});

describe(getFindingDetails, () => {
  let tenantId: string;
  let findingId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
    const opened = await openFinding({
      tenantId,
      source: FINDING_SOURCE.DOCUMENT_VALIDATION,
      kind: FINDING_KIND.SCHEMA_VALIDATION_ERROR,
      severity: FINDING_SEVERITY.WARNING,
      identifier: 'doc-1',
      details: { invalidDocumentCount: 2 },
    });
    if (!opened.ok) throw new Error('openFinding failed');
    findingId = opened.data.finding.id;
  });

  it("returns the finding's details for its own tenant", async () => {
    const result = await getFindingDetails(tenantId, findingId);

    expect(result).toEqual({ invalidDocumentCount: 2 });
  });

  it("returns null for another tenant's finding", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());

    const result = await getFindingDetails(otherTenantId, findingId);

    expect(result).toBeNull();
  });

  it('returns null for an unknown finding', async () => {
    const result = await getFindingDetails(
      tenantId,
      '00000000-0000-0000-0000-000000000000',
    );

    expect(result).toBeNull();
  });
});
