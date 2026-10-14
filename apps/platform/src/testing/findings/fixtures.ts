import {
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
  FINDING_STATUS,
} from '@blog/config/constants';
import type { TOpenFinding } from '@blog/db/queries/findings';

export const makeFinding = (
  overrides: Partial<TOpenFinding> = {},
): TOpenFinding => {
  return {
    id: 'finding-1',
    tenantId: 'tenant-1',
    source: FINDING_SOURCE.TENANT_PROVISIONING,
    kind: FINDING_KIND.PROVISIONING_STEP_FAILED,
    severity: FINDING_SEVERITY.CRITICAL,
    status: FINDING_STATUS.OPEN,
    dedupeKey: 'dedupe-1',
    hasDetails: false,
    firstSeenAt: new Date('2026-04-01T00:00:00.000Z'),
    lastSeenAt: new Date('2026-04-02T00:00:00.000Z'),
    resolvedAt: null,
    tenantName: 'Acme Inc.',
    ...overrides,
  };
};
