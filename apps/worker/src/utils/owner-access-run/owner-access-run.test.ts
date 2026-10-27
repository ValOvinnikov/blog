import { OWNER_ACCESS_HOOK_TOKEN_PREFIX } from '@worker/constants/owner-access';
import { MOCK_QUEUE_DOWN } from '@worker/testing/outage/fixtures';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { ensureOwnerAccess } from '@worker/workflows/ensure-owner-access';
import { resumeHook, start } from 'workflow/api';
import { HookNotFoundError } from 'workflow/errors';

import { wakeOwnerAccess } from './owner-access-run';

vi.mock('@worker/workflows/ensure-owner-access');
vi.mock('workflow/api');

const HOOK_TOKEN = `${OWNER_ACCESS_HOOK_TOKEN_PREFIX}${MOCK_TENANT_ID}`;

describe(wakeOwnerAccess, () => {
  it('wakes the run already checking the tenant', async () => {
    vi.mocked(resumeHook).mockResolvedValue({} as never);

    await wakeOwnerAccess(MOCK_TENANT_ID);

    expect(resumeHook).toHaveBeenCalledWith(HOOK_TOKEN, null);
    expect(start).not.toHaveBeenCalled();
  });

  it('starts a new run when none is checking the tenant', async () => {
    vi.mocked(resumeHook).mockRejectedValue(new HookNotFoundError(HOOK_TOKEN));

    await wakeOwnerAccess(MOCK_TENANT_ID);

    expect(start).toHaveBeenCalledWith(ensureOwnerAccess, [MOCK_TENANT_ID]);
  });

  it('starts nothing when waking fails for another reason', async () => {
    vi.mocked(resumeHook).mockRejectedValue(new Error(MOCK_QUEUE_DOWN));

    await expect(wakeOwnerAccess(MOCK_TENANT_ID)).rejects.toThrow(
      MOCK_QUEUE_DOWN,
    );
    expect(start).not.toHaveBeenCalled();
  });
});
