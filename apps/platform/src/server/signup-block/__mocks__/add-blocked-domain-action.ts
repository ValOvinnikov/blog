import type {
  TAddBlockedDomainInput,
  TAddBlockedDomainResult,
} from '@platform/server/signup-block/add-blocked-domain-action';
import { ACTION_OUTCOME } from '@shinefold/config';

export const addBlockedDomainAction = vi.fn<
  (input: TAddBlockedDomainInput) => Promise<TAddBlockedDomainResult>
>(async () => ({ outcome: ACTION_OUTCOME.SUCCESS }));
