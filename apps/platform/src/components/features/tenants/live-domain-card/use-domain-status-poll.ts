'use client';

import {
  DOMAIN_VERIFICATION_STATUS,
  type TDomainVerificationStatus,
} from '@platform/constants/domain';
import { getDomainVerificationStatusAction } from '@platform/server/provisioning/get-domain-verification-status-action';
import { useEffect, useState } from 'react';

const DOMAIN_POLL_INTERVAL_MS = 10000;
const DOMAIN_POLL_MAX_TICKS = 30; // ~5 minutes of visible-tab polling

const isFinalDomainVerificationStatus = (status: TDomainVerificationStatus) =>
  status === DOMAIN_VERIFICATION_STATUS.VERIFIED ||
  status === DOMAIN_VERIFICATION_STATUS.NOT_CONFIGURED;

export const useDomainStatusPoll = (
  tenantId: string,
  initialStatus: TDomainVerificationStatus,
): TDomainVerificationStatus => {
  const [renderedInitialStatus, setRenderedInitialStatus] =
    useState(initialStatus);
  const [status, setStatus] = useState(initialStatus);

  if (initialStatus !== renderedInitialStatus) {
    setRenderedInitialStatus(initialStatus);
    setStatus(initialStatus);
  }

  const isFinal = isFinalDomainVerificationStatus(status);

  useEffect(() => {
    if (isFinal) {
      return;
    }

    let cancelled = false;
    let ticks = 0;

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'hidden') {
        return;
      }

      ticks += 1;
      if (ticks >= DOMAIN_POLL_MAX_TICKS) {
        clearInterval(intervalId);
      }

      getDomainVerificationStatusAction(tenantId)
        .then((result) => {
          if (!cancelled) {
            setStatus(result);
          }
        })
        .catch(() => undefined);
    }, DOMAIN_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [tenantId, isFinal]);

  return status;
};
