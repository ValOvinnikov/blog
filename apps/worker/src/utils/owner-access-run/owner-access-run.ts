import {
  OWNER_ACCESS_RUN_CHECKS,
  OWNER_ACCESS_STALE_RUN_AFTER_MS,
  OWNER_ACCESS_STALE_RUN_CANCEL_REASON,
} from '@worker/constants/owner-access';
import { WORKFLOW_RUN_STATUS } from '@worker/constants/workflow';
import { ownerAccessHookToken } from '@worker/utils/owner-access-hook/owner-access-hook';
import { ensureOwnerAccess } from '@worker/workflows/ensure-owner-access';
import { getHookByToken, getRun, resumeHook, start } from 'workflow/api';
import { HookNotFoundError } from 'workflow/errors';

const LIVE_RUN_STATUSES: string[] = Object.values(WORKFLOW_RUN_STATUS);

async function cancelStaleRun(token: string): Promise<boolean> {
  let runId: string;
  try {
    ({ runId } = await getHookByToken(token));
  } catch (error) {
    if (HookNotFoundError.is(error)) return false;
    throw error;
  }

  const run = getRun(runId);
  if (!LIVE_RUN_STATUSES.includes(await run.status)) return false;
  const age = Date.now() - (await run.createdAt).getTime();
  if (age < OWNER_ACCESS_STALE_RUN_AFTER_MS) return false;
  await run.cancel({ cancelReason: OWNER_ACCESS_STALE_RUN_CANCEL_REASON });
  return true;
}

async function resumeLiveRun(token: string): Promise<boolean> {
  try {
    await resumeHook(token, null);
    return true;
  } catch (error) {
    if (HookNotFoundError.is(error)) return false;
    throw error;
  }
}

export async function wakeOwnerAccess(
  tenantId: string,
  maxChecks: number = OWNER_ACCESS_RUN_CHECKS,
): Promise<void> {
  const token = ownerAccessHookToken(tenantId);
  const cancelled = await cancelStaleRun(token);
  if (!cancelled && (await resumeLiveRun(token))) return;
  await start(ensureOwnerAccess, [tenantId, maxChecks]);
}
