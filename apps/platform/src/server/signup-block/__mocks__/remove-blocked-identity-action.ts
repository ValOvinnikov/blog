import { ACTION_OUTCOME } from '@blog/config';
import type { TRemoveBlockedIdentityResult } from '@platform/server/signup-block/remove-blocked-identity-action';

export const removeBlockedIdentityAction = vi.fn<
  (id: string) => Promise<TRemoveBlockedIdentityResult>
>(async () => ({ outcome: ACTION_OUTCOME.SUCCESS }));
