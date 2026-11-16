import type { TRemoveBlockedIdentityResult } from '@platform/server/signup-block/remove-blocked-identity-action';
import { ACTION_OUTCOME } from '@shinefold/config';

export const removeBlockedIdentityAction = vi.fn<
  (id: string) => Promise<TRemoveBlockedIdentityResult>
>(async () => ({ outcome: ACTION_OUTCOME.SUCCESS }));
