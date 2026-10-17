import { CONTRAST_CHECK_OUTCOME } from '@blog/config/constants';
import type { TContrastResultBody } from '@blog/config/types';
import { faker } from '@faker-js/faker';

export function makeContrastResult(
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

export function makePassingContrastResult(
  overrides: Partial<TContrastResultBody> = {},
): TContrastResultBody {
  return makeContrastResult({
    outcome: CONTRAST_CHECK_OUTCOME.PASS,
    failureCount: 0,
    ...overrides,
  });
}
