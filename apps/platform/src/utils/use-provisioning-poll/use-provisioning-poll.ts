'use client';

import {
  type ACTION_OUTCOME,
  isOutcomeRefused,
  isOutcomeSuccess,
  type TMaybeNull,
  type TMaybeUndefined,
} from '@blog/config';
import {
  TENANT_PROVISIONING_STATUS,
  type TTenantProvisioningStatus,
} from '@blog/db/constants';
import type { TTenantProvisioningStatusResult } from '@blog/db/queries/tenants/get-tenant-provisioning-status';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import { getTenantProvisioningStatusAction } from '@platform/server/provisioning/get-tenant-provisioning-status-action';
import {
  retryProvisioningStepAction,
  type TRetryProvisioningRefusal,
} from '@platform/server/provisioning/retry-provisioning-step-action';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import {
  provisioningViewState,
  type TProvisioningViewState,
} from '@platform/utils/provisioning-view-state/provisioning-view-state';
import { settleAction } from '@platform/utils/settle-action/settle-action';
import { usePolledValue } from '@platform/utils/use-polled-value/use-polled-value';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { usePollErrorWarning } from './use-poll-error-warning';

// Short enough that a step lasting a couple of seconds is seen running.
export const STEP_POLL_INTERVAL_MS = 1500;
// 10 minutes: a worker run takes under a minute, leaving room for every unit's retries.
export const MAX_POLL_TICKS = (10 * 60_000) / STEP_POLL_INTERVAL_MS;

export type TDispatchNoticeKind =
  TRetryProvisioningRefusal | typeof ACTION_OUTCOME.SERVER_ERROR;

export type TUseProvisioningPollResult = TProvisioningViewState &
  TTenantProvisioningStatusResult & {
    dispatchNotice: TMaybeUndefined<TDispatchNoticeKind>;
    isDispatchPending: boolean;
    handleDispatch: () => void;
  };

export const useProvisioningPoll = (
  tenant: TClientTenant,
): TUseProvisioningPollResult => {
  const router = useRouter();
  const pollErrorWarning = usePollErrorWarning();
  const [isDispatchPending, setIsDispatchPending] = useState(false);
  const [dispatchNotice, setDispatchNotice] =
    useState<TMaybeUndefined<TDispatchNoticeKind>>(undefined);
  const [, startTransition] = useTransition();

  const statusDuringDispatch = (
    status: TMaybeNull<TTenantProvisioningStatus>,
  ) => (isDispatchPending ? TENANT_PROVISIONING_STATUS.PROVISIONING : status);

  const {
    value: { provisioningStatus: polledProvisioningStatus, provisioningSteps },
    setValue,
    restart,
  } = usePolledValue<TTenantProvisioningStatusResult>(
    tenant.id,
    tenant,
    getTenantProvisioningStatusAction,
    {
      intervalMs: STEP_POLL_INTERVAL_MS,
      maxTicks: MAX_POLL_TICKS,
      isActive: (polled) =>
        provisioningViewState(
          polled.provisioningSteps,
          statusDuringDispatch(polled.provisioningStatus),
        ).isProvisioningRunning,
      onResult: pollErrorWarning.dismiss,
      onError: pollErrorWarning.show,
    },
  );

  const provisioningStatus = statusDuringDispatch(polledProvisioningStatus);
  const viewState = provisioningViewState(
    provisioningSteps,
    provisioningStatus,
  );

  const handleDispatch = () => {
    setDispatchNotice(undefined);
    setIsDispatchPending(true);
    restart();
    startTransition(async () => {
      const result = await settleAction(retryProvisioningStepAction(tenant.id));

      const isRunUnderway =
        isOutcomeSuccess(result) ||
        (isOutcomeRefused(result) &&
          result.reason === TENANT_REFUSAL.ALREADY_IN_PROGRESS);
      if (isRunUnderway) {
        setValue((polled) => ({
          ...polled,
          provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        }));
        router.refresh();
      }
      if (!isOutcomeSuccess(result)) {
        setDispatchNotice(
          isOutcomeRefused(result) ? result.reason : result.outcome,
        );
      }

      setIsDispatchPending(false);
    });
  };

  return {
    ...viewState,
    dispatchNotice,
    isDispatchPending,
    handleDispatch,
    provisioningStatus,
    provisioningSteps,
  };
};
