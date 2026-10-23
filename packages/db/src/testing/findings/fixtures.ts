import { CONTRAST_CHECK_OUTCOME } from '@blog/config/constants';
import type { TContrastResultBody } from '@blog/config/types';
import { faker } from '@faker-js/faker';

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
