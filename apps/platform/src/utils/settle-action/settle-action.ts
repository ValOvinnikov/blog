import { markPageOutOfDate } from '@platform/utils/page-out-of-date/page-out-of-date';
import { ACTION_OUTCOME, type TOutcome } from '@shinefold/config';
import { toOutcome } from '@shinefold/utils/to-outcome';
import {
  unstable_isUnrecognizedActionError,
  unstable_rethrow,
} from 'next/navigation';

export type TUnreachedAction = TOutcome<typeof ACTION_OUTCOME.SERVER_ERROR>;

// The out-of-date save never settles, so its form shows no error beneath the reload dialog.
const UNSETTLED: Promise<never> = new Promise(() => {});

// A lost request rejects, which a bare transition sends to `error.tsx`; an action's `redirect()` and `notFound()` reject too, so those are rethrown.
export const settleAction = <TResult>(
  request: Promise<TResult>,
): Promise<TResult | TUnreachedAction> =>
  request.catch((error: unknown) => {
    unstable_rethrow(error);
    if (unstable_isUnrecognizedActionError(error)) {
      markPageOutOfDate();
      return UNSETTLED;
    }
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  });
