'use client';

import type { TMaybeUndefined } from '@blog/config';
import type { TReleaseRun } from '@platform/server/releases/get-release-run';
import { getReleaseRunAction } from '@platform/server/releases/get-release-run-action';
import type { TReleaseResult } from '@platform/server/releases/release-result';
import { isReleaseRunActive } from '@platform/utils/release-state/release-state';
import { useDocumentVisible } from '@platform/utils/use-document-visible/use-document-visible';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type TReleaseRunResult = TReleaseResult<TMaybeUndefined<TReleaseRun>>;

const POLL_INTERVAL_MS = 10_000;
// 90 minutes: outlasts the gate, the tenant fan-out and both deploys.
const MAX_POLL_TICKS = (90 * 60_000) / POLL_INTERVAL_MS;
// Tolerates the browser's clock running ahead of GitHub's.
const CLOCK_SKEW_MS = 60_000;

const isRunSince = (
  run: TMaybeUndefined<TReleaseRun>,
  startedAt: TMaybeUndefined<number>,
): boolean =>
  startedAt === undefined ||
  (run !== undefined && Date.parse(run.createdAt) >= startedAt - CLOCK_SKEW_MS);

export const useReleaseRun = (releaseRun: TReleaseRunResult) => {
  const router = useRouter();
  const isVisible = useDocumentVisible();
  const [renderedRun, setRenderedRun] = useState(releaseRun);
  const [polledRun, setPolledRun] = useState(releaseRun);
  const [startedAt, setStartedAt] = useState<TMaybeUndefined<number>>();
  const [pollTicks, setPollTicks] = useState(0);

  if (releaseRun !== renderedRun) {
    setRenderedRun(releaseRun);
    setPolledRun(releaseRun);
    setPollTicks(0);
  }

  const run = polledRun.ok ? polledRun.data : undefined;
  const isDispatchPending = !isRunSince(run, startedAt);
  const isActive =
    isDispatchPending || (run !== undefined && isReleaseRunActive(run.status));
  const shouldPoll = isActive && isVisible && pollTicks < MAX_POLL_TICKS;

  useEffect(() => {
    if (!shouldPoll) return;

    let cancelled = false;

    const intervalId = setInterval(() => {
      setPollTicks((ticks) => ticks + 1);

      void getReleaseRunAction()
        .then((result) => {
          if (cancelled || !result.ok) return;
          setPolledRun(result);
          const { data } = result;
          if (
            data &&
            isRunSince(data, startedAt) &&
            !isReleaseRunActive(data.status)
          ) {
            router.refresh();
          }
        })
        .catch(() => undefined);
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [shouldPoll, startedAt, router]);

  const markStarted = (time: number) => {
    setStartedAt(time);
    setPollTicks(0);
  };

  return {
    run: isDispatchPending ? undefined : run,
    isUnavailable: !polledRun.ok,
    isDispatchPending,
    isActive,
    markStarted,
  };
};
