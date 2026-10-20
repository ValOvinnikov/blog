import { TEST_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { ensureOwnerAccess } from '@worker/workflows/ensure-owner-access';
import { resumeHook, start } from 'workflow/api';
import { HookNotFoundError } from 'workflow/errors';

import { wakeOwnerAccess } from './owner-access-run';

vi.mock('@worker/workflows/ensure-owner-access', () => ({
  ensureOwnerAccess: vi.fn(),
}));
vi.mock('workflow/api', () => ({ resumeHook: vi.fn(), start: vi.fn() }));

describe(wakeOwnerAccess, () => {
  it('wakes the run already checking the tenant', async () => {
    vi.mocked(resumeHook).mockResolvedValue({} as never);

    await wakeOwnerAccess(TEST_TENANT_ID);

    expect(resumeHook).toHaveBeenCalledWith(
      `owner-access:${TEST_TENANT_ID}`,
      null,
    );
    expect(start).not.toHaveBeenCalled();
  });

  it('starts a new run when none is checking the tenant', async () => {
    vi.mocked(resumeHook).mockRejectedValue(
      new HookNotFoundError(`owner-access:${TEST_TENANT_ID}`),
    );

    await wakeOwnerAccess(TEST_TENANT_ID);

    expect(start).toHaveBeenCalledWith(ensureOwnerAccess, [TEST_TENANT_ID]);
  });

  it('starts nothing when waking fails for another reason', async () => {
    vi.mocked(resumeHook).mockRejectedValue(new Error('queue down'));

    await expect(wakeOwnerAccess(TEST_TENANT_ID)).rejects.toThrow('queue down');
    expect(start).not.toHaveBeenCalled();
  });
});
