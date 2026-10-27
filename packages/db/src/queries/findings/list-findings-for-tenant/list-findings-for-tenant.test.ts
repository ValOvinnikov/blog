import {
  FINDING_KIND,
  FINDING_SOURCE,
  FINDING_STATUS,
} from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import {
  MOCK_FINDING_LATER_AT,
  MOCK_FINDING_LATEST_AT,
  MOCK_FINDING_NOW,
  mockOpenFindingInput,
  openTestFinding,
} from '@blog/db/testing/findings/fixtures';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { resolveFinding } from '../resolve-finding';

import { listFindingsForTenant } from './list-findings-for-tenant';

faker.seed(6021005);

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  vi.useRealTimers();
  await db().delete(schema.findings);
  await db().delete(schema.tenants);
});

describe(listFindingsForTenant, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('returns only the tenant’s findings, most recently seen first', async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    vi.useFakeTimers({ now: MOCK_FINDING_NOW, toFake: ['Date'] });
    const older = await openTestFinding(mockOpenFindingInput({ tenantId }));
    vi.setSystemTime(MOCK_FINDING_LATER_AT);
    const newer = await openTestFinding(mockOpenFindingInput({ tenantId }));
    vi.setSystemTime(MOCK_FINDING_LATEST_AT);
    await openTestFinding(mockOpenFindingInput({ tenantId: otherTenantId }));

    const result = await listFindingsForTenant(tenantId);

    expect(result.map(({ id }) => id)).toEqual([newer.id, older.id]);
  });

  it('filters by status when given', async () => {
    const toResolve = await openTestFinding(mockOpenFindingInput({ tenantId }));
    const staysOpen = await openTestFinding(mockOpenFindingInput({ tenantId }));
    await resolveFinding(toResolve.id);

    const openOnly = await listFindingsForTenant(tenantId, FINDING_STATUS.OPEN);
    const resolvedOnly = await listFindingsForTenant(
      tenantId,
      FINDING_STATUS.RESOLVED,
    );

    expect(openOnly.map(({ id }) => id)).toEqual([staysOpen.id]);
    expect(resolvedOnly.map(({ id }) => id)).toEqual([toResolve.id]);
  });

  it('leaves details out and reports whether each finding has them', async () => {
    const base = {
      tenantId,
      source: FINDING_SOURCE.DOCUMENT_VALIDATION,
      kind: FINDING_KIND.SCHEMA_VALIDATION_ERROR,
    };
    const withDetails = await openTestFinding(
      mockOpenFindingInput({ ...base, details: { invalidDocumentCount: 1 } }),
    );
    const withoutDetails = await openTestFinding(mockOpenFindingInput(base));

    const result = await listFindingsForTenant(tenantId);

    const hasDetailsById = Object.fromEntries(
      result.map(({ id, hasDetails }) => [id, hasDetails]),
    );
    const columns = result.flatMap((finding) => Object.keys(finding));
    expect(hasDetailsById).toEqual({
      [withDetails.id]: true,
      [withoutDetails.id]: false,
    });
    expect(columns).not.toContain('details');
  });

  it('returns an empty array for a tenant with no findings', async () => {
    const result = await listFindingsForTenant(tenantId);

    expect(result).toEqual([]);
  });
});
