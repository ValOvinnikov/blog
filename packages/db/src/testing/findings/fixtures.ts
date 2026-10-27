import {
  CONTRAST_CHECK_OUTCOME,
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
} from '@blog/config/constants';
import type { TContrastResultBody } from '@blog/config/types';
import {
  openFinding,
  type TOpenFindingInput,
} from '@blog/db/queries/findings/open-finding';
import type { TFinding } from '@blog/db/schema/findings';
import { faker } from '@faker-js/faker';

export const MOCK_FINDING_NOW = new Date('2026-10-01T10:00:00Z');
export const MOCK_FINDING_LATER_AT = new Date('2026-10-02T10:00:00Z');
export const MOCK_FINDING_LATEST_AT = new Date('2026-10-03T10:00:00Z');

export function mockContrastResult(
  overrides: Partial<TContrastResultBody> = {},
): TContrastResultBody {
  return {
    sha: faker.git.commitSha(),
    outcome: CONTRAST_CHECK_OUTCOME.FAIL,
    failureCount: faker.number.int({ min: 1, max: 20 }),
    runUrl: faker.internet.url(),
    ...overrides,
  };
}

export function mockPassingContrastResult(
  overrides: Partial<TContrastResultBody> = {},
): TContrastResultBody {
  return mockContrastResult({
    outcome: CONTRAST_CHECK_OUTCOME.PASS,
    failureCount: 0,
    ...overrides,
  });
}

export function mockOpenFindingInput(
  overrides: Partial<TOpenFindingInput> = {},
): TOpenFindingInput {
  return {
    source: FINDING_SOURCE.DOMAIN_VERIFICATION,
    kind: FINDING_KIND.DOMAIN_NOT_ADDED,
    severity: FINDING_SEVERITY.WARNING,
    identifier: faker.internet.domainName(),
    ...overrides,
  };
}

export async function openTestFinding(
  input: TOpenFindingInput,
): Promise<TFinding> {
  const opened = await openFinding(input);
  if (!opened.ok) throw new Error('openTestFinding: openFinding failed.');

  return opened.data.finding;
}

export function mockReleaseTag(): string {
  return `v${faker.system.semver()}`;
}
