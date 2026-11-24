import { ACCESS_RUN_CALL } from '@worker/constants/access-run';
import {
  OWNER_ACCESS_STALE_RUN_AFTER_MS,
  OWNER_ACCESS_STALE_RUN_CANCEL_REASON,
} from '@worker/constants/owner-access';
import { WORKFLOW_RUN_STATUS } from '@worker/constants/workflow';
import { getHookByToken, getRun, resumeHook } from 'workflow/api';
import { HookNotFoundError } from 'workflow/errors';

import { timeWorkflowCall } from './time-workflow-call';

const LIVE_RUN_STATUSES: string[] = Object.values(WORKFLOW_RUN_STATUS);

async function cancelStaleRun(token: string): Promise<boolean> {
  let runId: string;
  try {
    ({ runId } = await timeWorkflowCall(
      ACCESS_RUN_CALL.GET_HOOK_BY_TOKEN,
      { token },
      () => getHookByToken(token),
    ));
  } catch (error) {
    if (HookNotFoundError.is(error)) return false;
    throw error;
  }

  const run = getRun(runId);
  const context = { token, runId };
  const status = await timeWorkflowCall(
    ACCESS_RUN_CALL.RUN_STATUS,
    context,
    () => run.status,
  );
  if (!LIVE_RUN_STATUSES.includes(status)) return false;
  const createdAt = await timeWorkflowCall(
    ACCESS_RUN_CALL.RUN_CREATED_AT,
    context,
    () => run.createdAt,
  );
  if (Date.now() - createdAt.getTime() < OWNER_ACCESS_STALE_RUN_AFTER_MS) {
    return false;
  }
  await timeWorkflowCall(ACCESS_RUN_CALL.RUN_CANCEL, context, () =>
    run.cancel({ cancelReason: OWNER_ACCESS_STALE_RUN_CANCEL_REASON }),
  );
  return true;
}

async function resumeLiveRun(token: string): Promise<boolean> {
  try {
    await timeWorkflowCall(ACCESS_RUN_CALL.RESUME_HOOK, { token }, () =>
      resumeHook(token, null),
    );
    return true;
  } catch (error) {
    if (HookNotFoundError.is(error)) return false;
    throw error;
  }
}

export async function wakeAccessRun(
  hookToken: string,
  startRun: () => Promise<unknown>,
): Promise<void> {
  const cancelled = await cancelStaleRun(hookToken);
  if (!cancelled && (await resumeLiveRun(hookToken))) return;
  await timeWorkflowCall(
    ACCESS_RUN_CALL.START_RUN,
    { token: hookToken },
    startRun,
  );
}
