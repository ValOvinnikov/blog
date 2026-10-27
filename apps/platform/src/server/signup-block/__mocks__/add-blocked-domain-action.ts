import { ACTION_OUTCOME } from '@blog/config';
import type {
  TAddBlockedDomainInput,
  TAddBlockedDomainResult,
} from '@platform/server/signup-block/add-blocked-domain-action';

export const addBlockedDomainAction = vi.fn<
  (input: TAddBlockedDomainInput) => Promise<TAddBlockedDomainResult>
>(async () => ({ outcome: ACTION_OUTCOME.SUCCESS }));
