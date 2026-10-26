import { ACTION_OUTCOME, type TActionOutcome } from '@blog/config/constants';

import {
  isOutcomeInvalid,
  isOutcomeServerError,
  isOutcomeSuccess,
} from './is-outcome';

const FIELD_ERRORS = { email: { reason: 'EMAIL_INVALID' } };

type TResult =
  | { outcome: typeof ACTION_OUTCOME.SUCCESS }
  | {
      outcome: typeof ACTION_OUTCOME.INVALID;
      fieldErrors: typeof FIELD_ERRORS;
    }
  | { outcome: typeof ACTION_OUTCOME.SERVER_ERROR };

const resultOf = (outcome: TActionOutcome) => ({ outcome });

describe.each([
  [isOutcomeSuccess, ACTION_OUTCOME.SUCCESS],
  [isOutcomeInvalid, ACTION_OUTCOME.INVALID],
  [isOutcomeServerError, ACTION_OUTCOME.SERVER_ERROR],
])('%o', (isGivenOutcome, outcome) => {
  it(`accepts a ${outcome} result`, () => {
    expect(isGivenOutcome(resultOf(outcome))).toBe(true);
  });

  it.each(Object.values(ACTION_OUTCOME).filter((other) => other !== outcome))(
    `refuses a %s result`,
    (other) => {
      expect(isGivenOutcome(resultOf(other))).toBe(false);
    },
  );
});

describe(isOutcomeInvalid, () => {
  it('narrows the result to the one carrying field errors', () => {
    const result: TResult = {
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: FIELD_ERRORS,
    };

    const fieldErrors = isOutcomeInvalid(result) ? result.fieldErrors : {};

    expect(fieldErrors).toEqual(FIELD_ERRORS);
  });
});
