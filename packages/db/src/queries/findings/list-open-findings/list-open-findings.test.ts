import {
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
} from '@blog/config/constants';
import { recordContrastResult } from '@blog/db/queries/findings/record-contrast-result';
import { resolveFinding } from '@blog/db/queries/findings/resolve-finding';
import * as schema from '@blog/db/schema';
import {
  mockContrastResult,
  mockOpenFindingInput,
  mockReleaseTag,
  openTestFinding,
} from '@blog/db/testing/findings/fixtures';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { listOpenFindings } from './list-open-findings';

faker.seed(6021006);

vi.mock('@blog/db/client');

const db = useQueryTestDb();

const MOCK_TENANT_NAME = faker.company.name();

function openPlatformWideFinding(details?: Record<string, unknown>) {
  return openTestFinding(
    mockOpenFindingInput({
      source: FINDING_SOURCE.RECHECK_TENANT_OWNERS,
      kind: FINDING_KIND.OWNER_CHECK_AMBIGUOUS,
      severity: FINDING_SEVERITY.INFO,
      details,
    }),
  );
}

afterEach(async () => {
  await db().delete(schema.findings);
  await db().delete(schema.tenants);
});

describe(listOpenFindings, () => {
  it('returns open findings across every tenant, excluding resolved ones', async () => {
    const { id: tenantOneId } = await insertTestTenant(db());
    const { id: tenantTwoId } = await insertTestTenant(db());
    const resolved = await openTestFinding(
      mockOpenFindingInput({ tenantId: tenantOneId }),
    );
    const tenantFinding = await openTestFinding(
      mockOpenFindingInput({
        tenantId: tenantTwoId,
        source: FINDING_SOURCE.TENANT_PROVISIONING,
        kind: FINDING_KIND.PROVISIONING_STEP_FAILED,
        severity: FINDING_SEVERITY.CRITICAL,
      }),
    );
    const platformFinding = await openPlatformWideFinding();
    await resolveFinding(resolved.id);

    const result = await listOpenFindings();

    expect(result.map(({ id }) => id).sort()).toEqual(
      [tenantFinding.id, platformFinding.id].sort(),
    );
  });

  it('joins each finding to its tenant name and leaves details out', async () => {
    const { id: tenantId } = await insertTestTenant(db(), {
      name: MOCK_TENANT_NAME,
    });
    const tenantScoped = await openTestFinding(
      mockOpenFindingInput({
        tenantId,
        source: FINDING_SOURCE.DOCUMENT_VALIDATION,
        kind: FINDING_KIND.SCHEMA_VALIDATION_ERROR,
        details: { invalidDocumentCount: 1 },
      }),
    );
    const platformWide = await openPlatformWideFinding();

    const result = await listOpenFindings();

    const tenantRow = result.find(({ id }) => id === tenantScoped.id);
    const platformRow = result.find(({ id }) => id === platformWide.id);
    const columns = result.flatMap((finding) => Object.keys(finding));
    expect(tenantRow?.tenantName).toBe(MOCK_TENANT_NAME);
    expect(tenantRow?.hasDetails).toBe(true);
    expect(platformRow?.tenantName).toBeNull();
    expect(platformRow?.hasDetails).toBe(false);
    expect(columns).not.toContain('details');
  });

  it('carries the contrast result on a contrast finding and on no other', async () => {
    const failingRun = mockContrastResult({ tag: mockReleaseTag() });
    const contrastFinding = await recordContrastResult(failingRun);
    const ownerCheck = await openPlatformWideFinding({
      reason: faker.lorem.sentence(),
    });

    const result = await listOpenFindings();

    const contrastRow = result.find(({ id }) => id === contrastFinding.id);
    const ownerCheckRow = result.find(({ id }) => id === ownerCheck.id);
    expect(contrastRow?.contrastResult).toEqual(failingRun);
    expect(ownerCheckRow?.contrastResult).toBeNull();
  });

  it('returns an empty array when nothing is open', async () => {
    const result = await listOpenFindings();

    expect(result).toEqual([]);
  });
});
