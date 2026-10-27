import * as schema from '@blog/db/schema';
import { mockOpenFindingInput } from '@blog/db/testing/findings/fixtures';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { openFinding } from '../open-finding';

import { getFindingDetails } from './get-finding-details';

faker.seed(6021002);

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.findings);
  await db().delete(schema.tenants);
});

describe(getFindingDetails, () => {
  let tenantId: string;
  let findingId: string;
  let details: Record<string, unknown>;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
    details = { invalidDocumentCount: faker.number.int({ min: 1, max: 50 }) };
    const opened = await openFinding(
      mockOpenFindingInput({ tenantId, details }),
    );
    if (!opened.ok) throw new Error('openFinding failed');
    findingId = opened.data.finding.id;
  });

  it("returns the finding's details for its own tenant", async () => {
    const result = await getFindingDetails(tenantId, findingId);

    expect(result).toEqual(details);
  });

  it("returns null for another tenant's finding", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());

    const result = await getFindingDetails(otherTenantId, findingId);

    expect(result).toBeNull();
  });

  it('returns null for an unknown finding', async () => {
    const result = await getFindingDetails(tenantId, faker.string.uuid());

    expect(result).toBeNull();
  });
});
