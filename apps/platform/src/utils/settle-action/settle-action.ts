import { ACTION_OUTCOME, type TOutcome } from '@blog/config';
import { toOutcome } from '@blog/utils/to-outcome';
import { unstable_rethrow } from 'next/navigation';

export type TUnreachedAction = TOutcome<typeof ACTION_OUTCOME.SERVER_ERROR>;

// A lost request rejects, which a bare transition sends to `error.tsx`; an action's `redirect()` and `notFound()` reject too, so those are rethrown.
export const settleAction = <TResult>(
  request: Promise<TResult>,
): Promise<TResult | TUnreachedAction> =>
  request.catch((error: unknown) => {
    unstable_rethrow(error);
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  });
