import { ACTION_OUTCOME, type TOutcome } from '@blog/config';
import { toOutcome } from '@blog/utils/to-outcome';

export type TUnreachedAction = TOutcome<typeof ACTION_OUTCOME.SERVER_ERROR>;

// A Server Action whose request never reaches the server rejects, which a bare transition sends to `error.tsx`.
export const settleAction = <TResult>(
  request: Promise<TResult>,
): Promise<TResult | TUnreachedAction> =>
  request.catch(() => toOutcome(ACTION_OUTCOME.SERVER_ERROR));
