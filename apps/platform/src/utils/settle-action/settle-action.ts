import { ACTION_OUTCOME, type TOutcome } from '@blog/config';
import { toOutcome } from '@blog/utils/to-outcome';
import { markPageOutOfDate } from '@platform/utils/page-out-of-date/page-out-of-date';
import {
  unstable_isUnrecognizedActionError,
  unstable_rethrow,
} from 'next/navigation';

export type TUnreachedAction = TOutcome<typeof ACTION_OUTCOME.SERVER_ERROR>;

const UNSETTLED: Promise<never> = new Promise(() => {});

// A lost request rejects, which a bare transition sends to `error.tsx`; an action's `redirect()` and `notFound()` reject too, so those are rethrown.
// An action missing from the current build means the page is out of date: the save never settles, so the form shows no error beneath the reload dialog.
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
