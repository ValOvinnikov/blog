import type { TDomainVerificationStatus } from '@platform/constants/domain';

export type TDomainDnsRecord = {
  type: string;
  name: string;
  value: string;
};

export type TProjectDomain = {
  status: TDomainVerificationStatus;
  dnsRecords: TDomainDnsRecord[];
};

export const projectDomain = (
  status: TDomainVerificationStatus,
  dnsRecords: TDomainDnsRecord[] = [],
): TProjectDomain => ({ status, dnsRecords });
