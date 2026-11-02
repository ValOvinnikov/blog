import { ACTION_OUTCOME } from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import { SETTINGS_REFUSAL } from '@platform/constants/settings';

import { isNotInPlanRefusal, toNotInPlanRefusal } from './plan-refusal';

describe(isNotInPlanRefusal, () => {
  it('recognises a refusal built for the plan', () => {
    expect(isNotInPlanRefusal(toNotInPlanRefusal(TENANT_PLAN.FREE, []))).toBe(
      true,
    );
  });

  it('rejects a refusal with another reason', () => {
    const notFound = {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SETTINGS_REFUSAL.NOT_FOUND,
    };

    expect(isNotInPlanRefusal(notFound)).toBe(false);
  });

  it('rejects a failure that is not a refusal', () => {
    expect(isNotInPlanRefusal({ outcome: ACTION_OUTCOME.SERVER_ERROR })).toBe(
      false,
    );
  });
});
