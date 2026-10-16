'use client';

import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import {
  TENANT_PROVISIONING_STATUS,
  type TTenantProvisioningStatus,
} from '@blog/db/constants';
import type { TTenantProvisioningState } from '@blog/db/schema/tenants';
import { useToast } from '@platform/context/toast-provider';
import { getTenantProvisioningStatusAction } from '@platform/server/provisioning/get-tenant-provisioning-status-action';
import { retryProvisioningStepAction } from '@platform/server/provisioning/retry-provisioning-step-action';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import {
  provisioningViewState,
  type TProvisioningViewState,
} from '@platform/utils/provisioning-view-state/provisioning-view-state';
import { useDocumentVisible } from '@platform/utils/use-document-visible/use-document-visible';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useEffect, useRef, useTransition } from 'react';

// Short enough that a step lasting a couple of seconds is seen running.
const STEP_POLL_INTERVAL_MS = 1500;
// 25 minutes: outlasts the workflow's 20-minute job timeout plus runner pickup.
const MAX_POLL_TICKS = (25 * 60_000) / STEP_POLL_INTERVAL_MS;

export type TDispatchNoticeKind =
  'not-found' | 'archived' | 'already-in-progress' | 'other';

export type TUseProvisioningPollResult = TProvisioningViewState & {
  dispatchNotice: TMaybeUndefined<TDispatchNoticeKind>;
  isDispatchPending: boolean;
  handleDispatch: () => void;
  provisioningStatus: TMaybeNull<TTenantProvisioningStatus>;
  provisioningSteps: TMaybeNull<TTenantProvisioningState>;
};

export const useProvisioningPoll = (
  tenant: TClientTenant,
): TUseProvisioningPollResult => {
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations('provisioningStatusView');
  const pollErrorToastIdRef = useRef<TMaybeNull<string>>(null);
  const [isDispatchPending, setIsDispatchPending] = useState(false);
  const [dispatchNotice, setDispatchNotice] =
    useState<TMaybeUndefined<TDispatchNoticeKind>>(undefined);
  const [, startTransition] = useTransition();
  const [renderedTenant, setRenderedTenant] = useState(tenant);
  const [polledProvisioningStatus, setPolledProvisioningStatus] = useState<
    TMaybeNull<TTenantProvisioningStatus>
  >(tenant.provisioningStatus);
  const [provisioningSteps, setProvisioningSteps] = useState<
    TMaybeNull<TTenantProvisioningState>
  >(tenant.provisioningSteps);
  const [pollTicks, setPollTicks] = useState(0);
  const isVisible = useDocumentVisible();

  if (tenant !== renderedTenant) {
    setRenderedTenant(tenant);
    setPolledProvisioningStatus(tenant.provisioningStatus);
    setProvisioningSteps(tenant.provisioningSteps);
    setPollTicks(0);
  }

  const provisioningStatus = isDispatchPending
    ? TENANT_PROVISIONING_STATUS.PROVISIONING
    : polledProvisioningStatus;
  const viewState = provisioningViewState(
    provisioningSteps,
    provisioningStatus,
  );
  const shouldPoll =
    viewState.isProvisioningRunning && isVisible && pollTicks < MAX_POLL_TICKS;

  useEffect(() => {
    if (!shouldPoll) {
      return;
    }

    let cancelled = false;

    const intervalId = setInterval(() => {
      setPollTicks((ticks) => ticks + 1);

      void getTenantProvisioningStatusAction(tenant.id)
        .then((result) => {
          if (cancelled || !result) {
            return;
          }
          if (pollErrorToastIdRef.current) {
            toast.dismiss(pollErrorToastIdRef.current);
            pollErrorToastIdRef.current = null;
          }
          setPolledProvisioningStatus(result.provisioningStatus);
          setProvisioningSteps(result.provisioningSteps);
        })
        .catch(() => {
          if (cancelled) {
            return;
          }
          if (!pollErrorToastIdRef.current) {
            pollErrorToastIdRef.current = toast.warning({
              message: t('pollErrorWarning'),
            });
          }
        });
    }, STEP_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [tenant.id, shouldPoll, toast, t]);

  const handleDispatch = () => {
    setDispatchNotice(undefined);
    setIsDispatchPending(true);
    setPollTicks(0);
    startTransition(async () => {
      const result = await retryProvisioningStepAction(tenant.id);

      if (
        result.outcome === 'dispatched' ||
        result.outcome === 'already-in-progress'
      ) {
        setPolledProvisioningStatus(TENANT_PROVISIONING_STATUS.PROVISIONING);
        router.refresh();
      }
      if (result.outcome !== 'dispatched') {
        setDispatchNotice(
          result.outcome === 'dispatch-error' ? 'other' : result.outcome,
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
