'use client';

import type { TTenant } from '@blog/db/schema/tenants';
import { DomainCard } from '@platform/components/features/tenants/domain-card';
import type { TDomainVerificationStatus } from '@platform/constants/domain';
import { use } from 'react';

import { useDomainStatusPoll } from './use-domain-status-poll';

export type TLiveDomainCardProps = {
  tenant: TTenant;
  domainVerificationStatus: Promise<TDomainVerificationStatus>;
  dnsHref: string;
};

export const LiveDomainCard = ({
  tenant,
  domainVerificationStatus,
  dnsHref,
}: TLiveDomainCardProps) => {
  const status = useDomainStatusPoll(tenant.id, use(domainVerificationStatus));

  return (
    <DomainCard
      tenant={tenant}
      domainVerificationStatus={status}
      dnsHref={dnsHref}
    />
  );
};
