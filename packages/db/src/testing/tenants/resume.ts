import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { MOCK_NOW } from '@blog/db/testing/frozen-clock';
import { createMockFaker } from '@blog/db/testing/mock-faker';
import { mockStripeIds } from '@blog/db/testing/tenants/billing';
import { MOCK_SELF_SERVE_OWNER_EMAIL_INDEX } from '@blog/db/testing/tenants/self-serve-fixtures';

type TResumedFields = Pick<
  TTenant,
  'plan' | 'status' | 'selfServeOwnerEmailIndex'
>;

const resumeFaker = createMockFaker(6874);
const MOCK_TRIAL_ENDS_LATER = resumeFaker.date.soon({ refDate: MOCK_NOW });
const MOCK_TRIAL_ENDED = resumeFaker.date.recent({ refDate: MOCK_NOW });

export const MOCK_RESUME_CASES: [string, Partial<TTenant>, TResumedFields][] = [
  [
    'a trial still running',
    {
      plan: TENANT_PLAN.GROWTH,
      trialEndsAt: MOCK_TRIAL_ENDS_LATER,
      selfServeOwnerEmailIndex: MOCK_SELF_SERVE_OWNER_EMAIL_INDEX,
    },
    {
      plan: TENANT_PLAN.GROWTH,
      status: TENANT_STATUS.TRIAL,
      selfServeOwnerEmailIndex: MOCK_SELF_SERVE_OWNER_EMAIL_INDEX,
    },
  ],
  [
    'a trial that has ended',
    {
      plan: TENANT_PLAN.GROWTH,
      trialEndsAt: MOCK_TRIAL_ENDED,
      selfServeOwnerEmailIndex: MOCK_SELF_SERVE_OWNER_EMAIL_INDEX,
    },
    {
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
      selfServeOwnerEmailIndex: MOCK_SELF_SERVE_OWNER_EMAIL_INDEX,
    },
  ],
  [
    'a paid site',
    {
      plan: TENANT_PLAN.GROWTH,
      trialEndsAt: MOCK_TRIAL_ENDED,
      stripeSubscriptionId: mockStripeIds().stripeSubscriptionId,
      selfServeOwnerEmailIndex: MOCK_SELF_SERVE_OWNER_EMAIL_INDEX,
    },
    {
      plan: TENANT_PLAN.GROWTH,
      status: TENANT_STATUS.ACTIVE,
      selfServeOwnerEmailIndex: null,
    },
  ],
  [
    'a Free site',
    {
      plan: TENANT_PLAN.FREE,
      selfServeOwnerEmailIndex: MOCK_SELF_SERVE_OWNER_EMAIL_INDEX,
    },
    {
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
      selfServeOwnerEmailIndex: MOCK_SELF_SERVE_OWNER_EMAIL_INDEX,
    },
  ],
];

export function pickResumedFields({
  plan,
  status,
  selfServeOwnerEmailIndex,
}: TResumedFields): TResumedFields {
  return { plan, status, selfServeOwnerEmailIndex };
}
