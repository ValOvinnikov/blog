import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { mockStripeIds } from '@blog/db/testing/tenants/billing';
import { MOCK_SELF_SERVE_OWNER_EMAIL_INDEX } from '@blog/db/testing/tenants/self-serve-fixtures';

type TResumedFields = Pick<
  TTenant,
  'plan' | 'status' | 'selfServeOwnerEmailIndex'
>;

const MOCK_TRIAL_ENDS_LATER = new Date('2999-01-01T00:00:00.000Z');
const MOCK_TRIAL_ENDED = new Date('2000-01-01T00:00:00.000Z');
const key = MOCK_SELF_SERVE_OWNER_EMAIL_INDEX;

export const MOCK_RESUME_CASES: [string, Partial<TTenant>, TResumedFields][] = [
  [
    'a trial still running',
    {
      plan: TENANT_PLAN.GROWTH,
      trialEndsAt: MOCK_TRIAL_ENDS_LATER,
      selfServeOwnerEmailIndex: key,
    },
    {
      plan: TENANT_PLAN.GROWTH,
      status: TENANT_STATUS.TRIAL,
      selfServeOwnerEmailIndex: key,
    },
  ],
  [
    'a trial that has ended',
    {
      plan: TENANT_PLAN.GROWTH,
      trialEndsAt: MOCK_TRIAL_ENDED,
      selfServeOwnerEmailIndex: key,
    },
    {
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
      selfServeOwnerEmailIndex: key,
    },
  ],
  [
    'a paid site',
    {
      plan: TENANT_PLAN.GROWTH,
      trialEndsAt: MOCK_TRIAL_ENDED,
      stripeSubscriptionId: mockStripeIds().stripeSubscriptionId,
      selfServeOwnerEmailIndex: key,
    },
    {
      plan: TENANT_PLAN.GROWTH,
      status: TENANT_STATUS.ACTIVE,
      selfServeOwnerEmailIndex: null,
    },
  ],
  [
    'a Free site',
    { plan: TENANT_PLAN.FREE, selfServeOwnerEmailIndex: key },
    {
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
      selfServeOwnerEmailIndex: key,
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
