import {
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
} from '@blog/config/constants';
import { openFinding } from '@blog/db/queries/findings/open-finding';
import { recordContrastResult } from '@blog/db/queries/findings/record-contrast-result';
import { resolveFinding } from '@blog/db/queries/findings/resolve-finding';
import * as schema from '@blog/db/schema';
import { mockContrastResult } from '@blog/db/testing/findings/fixtures';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { listOpenFindings } from './list-open-findings';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const MOCK_PLATFORM_FINDING_IDENTIFIER = 'platform-wide';
const MOCK_TENANT_NAME = 'Acme';

async function openPlatformWideFinding(
  details?: Record<string, unknown>,
): Promise<void> {
  await openFinding({
    source: FINDING_SOURCE.RECHECK_TENANT_OWNERS,
    kind: FINDING_KIND.OWNER_CHECK_AMBIGUOUS,
    severity: FINDING_SEVERITY.INFO,
    identifier: MOCK_PLATFORM_FINDING_IDENTIFIER,
    details,
  });
}

afterEach(async () => {
  await db().delete(schema.findings);
  await db().delete(schema.tenants);
});

describe(listOpenFindings, () => {
  it('returns open findings across every tenant, excluding resolved ones', async () => {
    const { id: tenantOneId } = await insertTestTenant(db());
    const { id: tenantTwoId } = await insertTestTenant(db());
    const resolved = await openFinding({
      tenantId: tenantOneId,
      source: FINDING_SOURCE.DOMAIN_VERIFICATION,
      kind: FINDING_KIND.DOMAIN_NOT_ADDED,
      severity: FINDING_SEVERITY.WARNING,
      identifier: 'resolved-one',
    });
    await openFinding({
      tenantId: tenantTwoId,
      source: FINDING_SOURCE.TENANT_PROVISIONING,
      kind: FINDING_KIND.PROVISIONING_STEP_FAILED,
      severity: FINDING_SEVERITY.CRITICAL,
      identifier: 'still-open',
    });
    await openPlatformWideFinding();
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    await resolveFinding(resolved.data.finding.id);

    const result = await listOpenFindings();

    expect(result).toHaveLength(2);
    expect(
      result.some((finding) => finding.id === resolved.data.finding.id),
    ).toBe(false);
  });

  it('joins each finding to its tenant name and leaves details out', async () => {
    const { id: tenantId } = await insertTestTenant(db(), {
      name: MOCK_TENANT_NAME,
    });
    await openFinding({
      tenantId,
      source: FINDING_SOURCE.DOCUMENT_VALIDATION,
      kind: FINDING_KIND.SCHEMA_VALIDATION_ERROR,
      severity: FINDING_SEVERITY.WARNING,
      identifier: 'tenant-scoped',
      details: { invalidDocumentCount: 1 },
    });
    await openPlatformWideFinding();

    const result = await listOpenFindings();

    const tenantScoped = result.find(
      (finding) => finding.tenantId === tenantId,
    );
    const platformWide = result.find((finding) => finding.tenantId === null);
    expect(result).toHaveLength(2);
    expect(tenantScoped?.tenantName).toBe(MOCK_TENANT_NAME);
    expect(tenantScoped?.hasDetails).toBe(true);
    expect(platformWide?.tenantName).toBeNull();
    expect(platformWide?.hasDetails).toBe(false);
    expect(result.every((finding) => !('details' in finding))).toBe(true);
  });

  it('carries the contrast result on a contrast finding and on no other', async () => {
    const failingRun = mockContrastResult({ tag: 'v1.2.0' });
    await recordContrastResult(failingRun);
    await openPlatformWideFinding({ reason: 'two owners' });

    const result = await listOpenFindings();

    const contrast = result.find(
      (finding) => finding.source === FINDING_SOURCE.CONTRAST_CHECK,
    );
    const ownerCheck = result.find(
      (finding) => finding.source === FINDING_SOURCE.RECHECK_TENANT_OWNERS,
    );
    expect(contrast?.contrastResult).toEqual(failingRun);
    expect(ownerCheck?.contrastResult).toBeNull();
  });

  it('returns an empty array when nothing is open', async () => {
    const result = await listOpenFindings();

    expect(result).toEqual([]);
  });
});
