import { CAPABILITY } from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';

import { lowestPlanWithCapability } from './lowest-plan-with-capability';

describe(lowestPlanWithCapability, () => {
  it.each([
    [CAPABILITY.CONSENT_BANNER, TENANT_PLAN.FREE],
    [CAPABILITY.CONTACT_FORM, TENANT_PLAN.STARTER],
    [CAPABILITY.NEWSLETTER, TENANT_PLAN.GROWTH],
  ])('names the cheapest plan holding %s', (capability, plan) => {
    expect(lowestPlanWithCapability(capability)).toBe(plan);
  });
});
