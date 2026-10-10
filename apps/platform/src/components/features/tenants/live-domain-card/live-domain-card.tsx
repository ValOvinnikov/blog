'use client';

import { DomainCard } from '@platform/components/features/tenants/domain-card';
import type { TDomainVerificationStatus } from '@platform/constants/domain';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import { use } from 'react';

import { useDomainStatusPoll } from './use-domain-status-poll';

export type TLiveDomainCardProps = {
  tenant: TClientTenant;
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
