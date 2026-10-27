import {
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
  FINDING_STATUS,
} from '@blog/config/constants';
import type { TOpenFinding } from '@blog/db/queries/findings';
import {
  MOCK_TENANT_NAME,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';

export const MOCK_FINDING_LAST_SEEN_AT = new Date('2026-04-02T00:00:00.000Z');

export const mockFinding = (
  overrides: Partial<TOpenFinding> = {},
): TOpenFinding => {
  return {
    id: 'finding-1',
    tenantId: MOCK_TENANT_ID,
    source: FINDING_SOURCE.TENANT_PROVISIONING,
    kind: FINDING_KIND.PROVISIONING_STEP_FAILED,
    severity: FINDING_SEVERITY.CRITICAL,
    status: FINDING_STATUS.OPEN,
    dedupeKey: 'dedupe-1',
    hasDetails: false,
    firstSeenAt: new Date('2026-04-01T00:00:00.000Z'),
    lastSeenAt: MOCK_FINDING_LAST_SEEN_AT,
    resolvedAt: null,
    tenantName: MOCK_TENANT_NAME,
    contrastResult: null,
    ...overrides,
  };
};

export const MOCK_COMMIT_SHA = 'abcdef0123456789abcdef0123456789abcdef01';
export const MOCK_SHORT_COMMIT_SHA = 'abcdef0';
