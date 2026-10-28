'use client';

import {
  DOMAIN_VERIFICATION_STATUS,
  type TDomainVerificationStatus,
} from '@platform/constants/domain';
import { getDomainVerificationStatusAction } from '@platform/server/provisioning/get-domain-verification-status-action';

import { usePolledValue, type TPolledValueOptions } from './use-polled-value';

const DOMAIN_POLL_OPTIONS: TPolledValueOptions<TDomainVerificationStatus> = {
  intervalMs: 10000,
  maxTicks: 30,
  isFinal: (status) =>
    status === DOMAIN_VERIFICATION_STATUS.VERIFIED ||
    status === DOMAIN_VERIFICATION_STATUS.NOT_CONFIGURED,
};

export const useDomainStatusPoll = (
  tenantId: string,
  initialStatus: TDomainVerificationStatus,
  fetchStatus: (
    tenantId: string,
  ) => Promise<TDomainVerificationStatus> = getDomainVerificationStatusAction,
): TDomainVerificationStatus =>
  usePolledValue(tenantId, initialStatus, fetchStatus, DOMAIN_POLL_OPTIONS);
