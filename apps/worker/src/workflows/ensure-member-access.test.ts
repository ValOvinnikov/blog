import { ELEVATE_TENANT_OWNER_OUTCOME } from '@shinefold/db/constants';
import { MEMBER_ACCESS_HOOK_TOKEN_PREFIX } from '@worker/constants/member-access';
import { OWNER_ACCESS_SWEEP_CHECKS } from '@worker/constants/owner-access';
import { MOCK_MEMBERSHIP_ID } from '@worker/testing/member-access/fixtures';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { fakeRunHook } from '@worker/testing/workflow/run-hook';
import { checkMemberAccess } from '@worker/units/check-member-access';
import { createHook, sleep } from 'workflow';

import { ensureMemberAccess } from './ensure-member-access';

const { PENDING_ACCEPTANCE, ELEVATED } = ELEVATE_TENANT_OWNER_OUTCOME;

vi.mock('@worker/units/check-member-access');
vi.mock('workflow');

function checksReturn(...outcomes: (typeof PENDING_ACCEPTANCE | null)[]) {
  outcomes.forEach((outcome) =>
    vi.mocked(checkMemberAccess).mockResolvedValueOnce({
      outcome,
      hasFailed: false,
    }),
  );
}

describe(ensureMemberAccess, () => {
  beforeEach(() => {
    fakeRunHook();
    vi.mocked(sleep).mockResolvedValue(undefined);
  });

  it('holds a hook named for the tenant and the member', async () => {
    vi.mocked(checkMemberAccess).mockResolvedValue({
      outcome: ELEVATED,
      hasFailed: false,
    });

    await ensureMemberAccess(MOCK_TENANT_ID, MOCK_MEMBERSHIP_ID);

    expect(createHook).toHaveBeenCalledWith({
      token: `${MEMBER_ACCESS_HOOK_TOKEN_PREFIX}${MOCK_TENANT_ID}:${MOCK_MEMBERSHIP_ID}`,
    });
  });

  it('checks that member until they are granted access', async () => {
    checksReturn(PENDING_ACCEPTANCE, PENDING_ACCEPTANCE);
    vi.mocked(checkMemberAccess).mockResolvedValueOnce({
      outcome: ELEVATED,
      hasFailed: false,
    });

    const outcome = await ensureMemberAccess(
      MOCK_TENANT_ID,
      MOCK_MEMBERSHIP_ID,
    );

    expect(outcome).toBe(ELEVATED);
    expect(checkMemberAccess).toHaveBeenCalledTimes(3);
    expect(checkMemberAccess).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_MEMBERSHIP_ID,
    );
  });

  it('stops once the membership is gone', async () => {
    checksReturn(PENDING_ACCEPTANCE, null);

    const outcome = await ensureMemberAccess(
      MOCK_TENANT_ID,
      MOCK_MEMBERSHIP_ID,
    );

    expect(outcome).toBeNull();
    expect(checkMemberAccess).toHaveBeenCalledTimes(2);
  });

  it('makes only the checks it was started with', async () => {
    checksReturn(PENDING_ACCEPTANCE);

    await ensureMemberAccess(
      MOCK_TENANT_ID,
      MOCK_MEMBERSHIP_ID,
      OWNER_ACCESS_SWEEP_CHECKS,
    );

    expect(checkMemberAccess).toHaveBeenCalledTimes(OWNER_ACCESS_SWEEP_CHECKS);
  });
});
