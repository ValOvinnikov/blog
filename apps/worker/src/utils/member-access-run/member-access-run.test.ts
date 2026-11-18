import { MEMBER_ACCESS_HOOK_TOKEN_PREFIX } from '@worker/constants/member-access';
import {
  OWNER_ACCESS_RUN_CHECKS,
  OWNER_ACCESS_SWEEP_CHECKS,
} from '@worker/constants/owner-access';
import { MOCK_MEMBERSHIP_ID } from '@worker/testing/member-access/fixtures';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { ensureMemberAccess } from '@worker/workflows/ensure-member-access';
import { getHookByToken, resumeHook, start } from 'workflow/api';
import { HookNotFoundError } from 'workflow/errors';

import { wakeMemberAccess } from './member-access-run';

vi.mock('@worker/workflows/ensure-member-access');
vi.mock('workflow/api');

const MOCK_HOOK_TOKEN = `${MEMBER_ACCESS_HOOK_TOKEN_PREFIX}${MOCK_TENANT_ID}:${MOCK_MEMBERSHIP_ID}`;

describe(wakeMemberAccess, () => {
  beforeEach(() => {
    vi.mocked(getHookByToken).mockRejectedValue(
      new HookNotFoundError(MOCK_HOOK_TOKEN),
    );
  });

  it('wakes the run already checking that member', async () => {
    vi.mocked(resumeHook).mockResolvedValue({} as never);

    await wakeMemberAccess(MOCK_TENANT_ID, MOCK_MEMBERSHIP_ID);

    expect(resumeHook).toHaveBeenCalledWith(MOCK_HOOK_TOKEN, null);
    expect(start).not.toHaveBeenCalled();
  });

  describe('when no run is checking that member', () => {
    beforeEach(() => {
      vi.mocked(resumeHook).mockRejectedValue(
        new HookNotFoundError(MOCK_HOOK_TOKEN),
      );
    });

    it('starts a run making the full set of checks', async () => {
      await wakeMemberAccess(MOCK_TENANT_ID, MOCK_MEMBERSHIP_ID);

      expect(start).toHaveBeenCalledWith(ensureMemberAccess, [
        MOCK_TENANT_ID,
        MOCK_MEMBERSHIP_ID,
        OWNER_ACCESS_RUN_CHECKS,
      ]);
    });

    it('starts a run making the checks it was asked for', async () => {
      await wakeMemberAccess(
        MOCK_TENANT_ID,
        MOCK_MEMBERSHIP_ID,
        OWNER_ACCESS_SWEEP_CHECKS,
      );

      expect(start).toHaveBeenCalledWith(ensureMemberAccess, [
        MOCK_TENANT_ID,
        MOCK_MEMBERSHIP_ID,
        OWNER_ACCESS_SWEEP_CHECKS,
      ]);
    });
  });
});
