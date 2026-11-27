import {
  FINDING_SEVERITY,
  FINDING_SOURCE,
  FINDING_STATUS,
  type TFindingKind,
} from '@shinefold/config/constants';
import type { TFindingSummary } from '@shinefold/db/schema/findings';
import { createMockFaker } from '@worker/testing/mock-faker';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';

const mockFaker = createMockFaker(6031);

export const MOCK_FINDING_ID = mockFaker.string.uuid();
const MOCK_FINDING_SEEN_AT = new Date('2026-10-20T09:00:00.000Z');

export function mockOpenFindingSummary(
  kind: TFindingKind,
  overrides: Partial<TFindingSummary> = {},
): TFindingSummary {
  return {
    id: MOCK_FINDING_ID,
    tenantId: MOCK_TENANT_ID,
    source: FINDING_SOURCE.TENANT_PROVISIONING,
    kind,
    severity: FINDING_SEVERITY.WARNING,
    status: FINDING_STATUS.OPEN,
    dedupeKey: mockFaker.string.alphanumeric(12),
    hasDetails: true,
    firstSeenAt: MOCK_FINDING_SEEN_AT,
    lastSeenAt: MOCK_FINDING_SEEN_AT,
    resolvedAt: null,
    ...overrides,
  };
}
