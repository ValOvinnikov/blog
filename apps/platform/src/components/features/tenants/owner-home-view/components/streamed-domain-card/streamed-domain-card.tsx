import type { TTenant } from '@blog/db/schema/tenants';
import { DomainCard } from '@platform/components/features/tenants/domain-card';
import type { TDomainVerificationStatus } from '@platform/constants/domain';
import { use } from 'react';

export type TStreamedDomainCardProps = {
  tenant: TTenant;
  domainVerificationStatus: Promise<TDomainVerificationStatus>;
  dnsHref: string;
  isStackedToLg?: boolean;
};

export const StreamedDomainCard = ({
  tenant,
  domainVerificationStatus,
  dnsHref,
  isStackedToLg,
}: TStreamedDomainCardProps) => (
  <DomainCard
    tenant={tenant}
    domainVerificationStatus={use(domainVerificationStatus)}
    dnsHref={dnsHref}
    isStackedToLg={isStackedToLg}
  />
);
