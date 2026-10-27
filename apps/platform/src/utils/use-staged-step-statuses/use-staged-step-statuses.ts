'use client';

import {
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantProvisioningStepStatus,
} from '@blog/db/constants';
import { useEffect, useState } from 'react';

// Long enough to read a step's Running state before the next change replaces it.
export const STEP_REVEAL_DWELL_MS = 800;

type TStatuses = TTenantProvisioningStepStatus[];

const isSettled = (status: TTenantProvisioningStepStatus) =>
  status === TENANT_PROVISIONING_STEP_STATUS.DONE ||
  status === TENANT_PROVISIONING_STEP_STATUS.FAILED;

const isForward = (
  from: TTenantProvisioningStepStatus,
  to: TTenantProvisioningStepStatus,
) =>
  (from === TENANT_PROVISIONING_STEP_STATUS.IDLE &&
    to !== TENANT_PROVISIONING_STEP_STATUS.IDLE) ||
  (from === TENANT_PROVISIONING_STEP_STATUS.RUNNING && isSettled(to));

const revealNext = (shown: TStatuses, target: TStatuses): TStatuses => {
  const index = shown.findIndex((status, i) => status !== target[i]);
  const from = shown[index];
  const to = target[index];

  if (from === undefined || to === undefined) {
    return shown;
  }

  const next =
    from === TENANT_PROVISIONING_STEP_STATUS.IDLE && isSettled(to)
      ? TENANT_PROVISIONING_STEP_STATUS.RUNNING
      : to;

  return shown.map((status, i) => (i === index ? next : status));
};

/** Replays forward step changes one at a time, so steps that finish between two polls still show Running before they settle. */
export const useStagedStepStatuses = (
  target: TStatuses,
): { stagedStatuses: TStatuses; isRevealing: boolean } => {
  const [renderedTarget, setRenderedTarget] = useState(target);
  const [shown, setShown] = useState(target);

  if (target.join() !== renderedTarget.join()) {
    setRenderedTarget(target);
    setShown(
      target.map((to, i) => {
        const from = shown[i];
        return from !== undefined && isForward(from, to) ? from : to;
      }),
    );
  }

  const isRevealing = shown.join() !== renderedTarget.join();

  useEffect(() => {
    if (!isRevealing) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setShown((current) => revealNext(current, renderedTarget));
    }, STEP_REVEAL_DWELL_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isRevealing, shown, renderedTarget]);

  return { stagedStatuses: shown, isRevealing };
};
