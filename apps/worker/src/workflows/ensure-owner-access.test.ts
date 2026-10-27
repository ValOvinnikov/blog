import {
  ELEVATE_TENANT_OWNER_OUTCOME,
  type TElevateTenantOwnerOutcome,
} from '@blog/db/constants';
import {
  OWNER_ACCESS_FAST_POLL_INTERVAL,
  OWNER_ACCESS_FAST_POLL_TICKS,
  OWNER_ACCESS_HOOK_TOKEN_PREFIX,
  OWNER_ACCESS_SLOW_POLL_INTERVAL,
} from '@worker/constants/owner-access';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { checkOwnerAccess } from '@worker/units/check-owner-access';
import { createHook, type Hook, sleep } from 'workflow';

import { ensureOwnerAccess } from './ensure-owner-access';

const { PENDING_ACCEPTANCE, ELEVATED, STALLED } = ELEVATE_TENANT_OWNER_OUTCOME;

vi.mock('@worker/units/check-owner-access');
vi.mock('workflow');

function fakeHook(options: { conflict?: boolean; wakes?: number } = {}) {
  const { conflict = false, wakes = 0 } = options;
  let remainingWakes = wakes;
  const hook = {
    token: `${OWNER_ACCESS_HOOK_TOKEN_PREFIX}${MOCK_TENANT_ID}`,
    getConflict: vi.fn(async () => (conflict ? ({} as never) : null)),
    dispose: vi.fn(),
    [Symbol.asyncIterator]: () => ({
      next: () =>
        remainingWakes-- > 0
          ? Promise.resolve({ done: false, value: null })
          : new Promise<never>(() => {}),
    }),
  };
  vi.mocked(createHook).mockReturnValue(hook as unknown as Hook<null>);
  return hook;
}

function checksReturn(...outcomes: TElevateTenantOwnerOutcome[]) {
  outcomes.forEach((outcome) =>
    vi.mocked(checkOwnerAccess).mockResolvedValueOnce(outcome),
  );
}

describe(ensureOwnerAccess, () => {
  let hook: ReturnType<typeof fakeHook>;

  beforeEach(() => {
    hook = fakeHook();
    vi.mocked(sleep).mockResolvedValue(undefined);
  });

  it('keeps checking until the owner is granted access', async () => {
    checksReturn(PENDING_ACCEPTANCE, PENDING_ACCEPTANCE, ELEVATED);

    const outcome = await ensureOwnerAccess(MOCK_TENANT_ID);

    expect(outcome).toBe(ELEVATED);
    expect(checkOwnerAccess).toHaveBeenCalledTimes(3);
  });

  it('stops once the owner is stalled', async () => {
    checksReturn(PENDING_ACCEPTANCE, STALLED);

    await expect(ensureOwnerAccess(MOCK_TENANT_ID)).resolves.toBe(STALLED);
  });

  it('checks every minute for the fast-poll window, then hourly', async () => {
    const pending = Array.from(
      { length: OWNER_ACCESS_FAST_POLL_TICKS + 1 },
      () => PENDING_ACCEPTANCE,
    );
    checksReturn(...pending, ELEVATED);

    await ensureOwnerAccess(MOCK_TENANT_ID);

    const intervals = vi.mocked(sleep).mock.calls.map(([interval]) => interval);
    expect(intervals.slice(0, OWNER_ACCESS_FAST_POLL_TICKS)).toEqual(
      Array(OWNER_ACCESS_FAST_POLL_TICKS).fill(OWNER_ACCESS_FAST_POLL_INTERVAL),
    );
    expect(intervals[OWNER_ACCESS_FAST_POLL_TICKS]).toBe(
      OWNER_ACCESS_SLOW_POLL_INTERVAL,
    );
  });

  it('releases the hook when it finishes', async () => {
    checksReturn(ELEVATED);

    await ensureOwnerAccess(MOCK_TENANT_ID);

    expect(hook.dispose).toHaveBeenCalled();
  });

  describe('when woken mid-sleep', () => {
    beforeEach(() => {
      fakeHook({ wakes: 1 });
      vi.mocked(sleep).mockReturnValueOnce(new Promise<never>(() => {}));
    });

    it('checks again straight away, without waiting out the sleep', async () => {
      checksReturn(PENDING_ACCEPTANCE, ELEVATED);

      await expect(ensureOwnerAccess(MOCK_TENANT_ID)).resolves.toBe(ELEVATED);
      expect(checkOwnerAccess).toHaveBeenCalledTimes(2);
    });

    it('goes back to checking every minute', async () => {
      checksReturn(PENDING_ACCEPTANCE, PENDING_ACCEPTANCE, ELEVATED);

      await ensureOwnerAccess(MOCK_TENANT_ID);

      expect(vi.mocked(sleep).mock.calls.at(-1)?.[0]).toBe(
        OWNER_ACCESS_FAST_POLL_INTERVAL,
      );
    });
  });

  describe('when another run already owns the tenant', () => {
    beforeEach(() => {
      hook = fakeHook({ conflict: true });
    });

    it('leaves the checks to that run', async () => {
      await expect(ensureOwnerAccess(MOCK_TENANT_ID)).resolves.toBeNull();
      expect(checkOwnerAccess).not.toHaveBeenCalled();
    });

    it('releases its own hook', async () => {
      await ensureOwnerAccess(MOCK_TENANT_ID);

      expect(hook.dispose).toHaveBeenCalled();
    });
  });
});
