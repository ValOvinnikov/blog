import type { TDomainVerificationStatus } from '@blog/config';
import type { TTenant } from '@blog/db/schema/tenants';
import { DomainCard } from '@platform/components/features/tenants/domain-card';
import { use } from 'react';

export type TStreamedDomainCardProps = {
  tenant: TTenant;
  domainVerificationStatus: Promise<TDomainVerificationStatus>;
  dnsHref: string;
};

export const StreamedDomainCard = ({
  tenant,
  domainVerificationStatus,
  dnsHref,
}: TStreamedDomainCardProps) => (
  <DomainCard
    tenant={tenant}
    domainVerificationStatus={use(domainVerificationStatus)}
    dnsHref={dnsHref}
  />
);
