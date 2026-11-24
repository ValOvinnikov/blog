import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config/types';
import { sanitizeLogMessage } from '@shinefold/insight';
import {
  CANARY_FAILURE,
  CANARY_TIMEOUT_MS,
  type TCanaryFailure,
} from '@worker/constants/canary';
import { runCanary } from '@worker/workflows/run-canary';
import { start } from 'workflow/api';

type TCanaryMiss = { reason: TCanaryFailure; error?: string };

type TCanaryStage<T> = { ok: true; value: T } | ({ ok: false } & TCanaryMiss);

export type TCanaryOutcome =
  | { ok: true; runId: string; durationMs: number }
  | ({ ok: false; runId: TMaybeNull<string> } & TCanaryMiss);

function createDeadline(ms: number) {
  let timer: TMaybeUndefined<ReturnType<typeof setTimeout>>;
  const reached = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), ms);
  });

  return { reached, clear: () => clearTimeout(timer) };
}

async function settleBefore<T>(
  work: Promise<T>,
  deadline: Promise<null>,
  failure: TCanaryFailure,
): Promise<TCanaryStage<T>> {
  try {
    const settled = await Promise.race([
      work.then((value) => ({ value })),
      deadline,
    ]);
    if (!settled) return { ok: false, reason: CANARY_FAILURE.TIMED_OUT };

    return { ok: true, value: settled.value };
  } catch (error) {
    return { ok: false, reason: failure, error: sanitizeLogMessage(error) };
  }
}

export async function awaitCanaryRun(): Promise<TCanaryOutcome> {
  const startedAt = Date.now();
  const deadline = createDeadline(CANARY_TIMEOUT_MS);

  try {
    const started = await settleBefore(
      start(runCanary),
      deadline.reached,
      CANARY_FAILURE.START_FAILED,
    );
    if (!started.ok) return { ...started, runId: null };

    const { runId, returnValue } = started.value;
    const finished = await settleBefore(
      returnValue,
      deadline.reached,
      CANARY_FAILURE.RUN_FAILED,
    );
    if (!finished.ok) return { ...finished, runId };

    return { ok: true, runId, durationMs: Date.now() - startedAt };
  } finally {
    deadline.clear();
  }
}
