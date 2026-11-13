import type { TMaybeNull } from '@blog/config';
import { TENANT_PLAN } from '@blog/config/constants';
import { TENANT_STATUS } from '@blog/db/constants';
import { mockTenant } from '@platform/testing/tenants/fixtures';

import { trialFor } from './trial-for';

const MOCK_NOW = new Date('2026-11-12T09:00:00.000Z');
const MOCK_LATER = new Date('2026-11-26T09:00:00.000Z');
const MOCK_EARLIER = new Date('2026-11-05T09:00:00.000Z');

const trialTenant = (trialEndsAt: TMaybeNull<Date>) =>
  mockTenant({
    plan: TENANT_PLAN.GROWTH,
    status: TENANT_STATUS.TRIAL,
    trialEndsAt,
  });

describe(trialFor, () => {
  it.each([
    ['a running trial', MOCK_LATER, false],
    ['a trial past its end', MOCK_EARLIER, true],
  ])('describes %s', (_, endsAt, hasEnded) => {
    const trial = trialFor(trialTenant(endsAt), MOCK_NOW);

    expect(trial).toEqual({ plan: TENANT_PLAN.GROWTH, endsAt, hasEnded });
  });

  it('is undefined for a trial without an end date', () => {
    expect(trialFor(trialTenant(null), MOCK_NOW)).toBeUndefined();
  });

  it('is undefined for a site that is not on a trial', () => {
    expect(trialFor(mockTenant(), MOCK_NOW)).toBeUndefined();
  });
});
