'use client';

import { useDomainStatusPoll } from '@platform/components/features/tenants/live-domain-card';
import type { TDomainVerificationStatus } from '@platform/constants/domain';
import { getCustomDomainStatusAction } from '@platform/server/custom-domain/get-custom-domain-status-action';
import { useRouter } from 'next/navigation';
import { use, useEffect } from 'react';

export type TCustomDomainStatusRefresherProps = {
  tenantId: string;
  initialStatus: Promise<TDomainVerificationStatus>;
};

export const CustomDomainStatusRefresher = ({
  tenantId,
  initialStatus,
}: TCustomDomainStatusRefresherProps) => {
  const router = useRouter();
  const renderedStatus = use(initialStatus);
  const polledStatus = useDomainStatusPoll(
    tenantId,
    renderedStatus,
    getCustomDomainStatusAction,
  );

  useEffect(() => {
    if (polledStatus !== renderedStatus) {
      router.refresh();
    }
  }, [polledStatus, renderedStatus, router]);

  return null;
};
