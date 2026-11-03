import type { TMaybeUndefined } from '@blog/config';
import {
  DOMAIN_VERIFICATION_STATUS,
  ROUTING_RECORD_TYPE,
} from '@platform/constants/domain';
import { PROVISIONING_LOG } from '@platform/constants/provisioning';
import { logger } from '@platform/utils/logger/logger';

import { fetchVercel, type TVercelCredentials } from './vercel-client';
import type { TDomainDnsRecord, TProjectDomain } from './vercel-domains-api';

type TRankedOption<TValue> = { rank: number; value: TValue };

type TVercelDomainConfigResponse = {
  misconfigured?: boolean;
  recommendedIPv4?: TRankedOption<string[]>[];
  recommendedCNAME?: TRankedOption<string>[];
};

const preferredValue = <TValue>(
  options: TRankedOption<TValue>[] = [],
): TMaybeUndefined<TValue> =>
  [...options].sort((left, right) => left.rank - right.rank)[0]?.value;

const toRoutingRecords = (
  domain: string,
  isApex: boolean,
  { recommendedIPv4, recommendedCNAME }: TVercelDomainConfigResponse,
): TDomainDnsRecord[] => {
  const value = isApex
    ? preferredValue(recommendedIPv4)?.[0]
    : preferredValue(recommendedCNAME);

  return value
    ? [
        {
          type: isApex ? ROUTING_RECORD_TYPE.A : ROUTING_RECORD_TYPE.CNAME,
          name: domain,
          value,
        },
      ]
    : [];
};

export const getDomainRouting = async (
  credentials: TVercelCredentials,
  domain: string,
  isApex: boolean,
): Promise<TProjectDomain> => {
  const response = await fetchVercel(
    credentials,
    `/v6/domains/${encodeURIComponent(domain)}/config`,
    { projectIdOrName: credentials.projectId },
  );

  if (!response.ok) {
    logger.error(PROVISIONING_LOG.DOMAIN_CONFIG_CHECK_FAILED, {
      domain,
      responseStatus: response.status,
    });
    return { status: DOMAIN_VERIFICATION_STATUS.ERROR, dnsRecords: [] };
  }

  const config = (await response.json()) as TVercelDomainConfigResponse;

  return config.misconfigured
    ? {
        status: DOMAIN_VERIFICATION_STATUS.PENDING,
        dnsRecords: toRoutingRecords(domain, isApex, config),
      }
    : { status: DOMAIN_VERIFICATION_STATUS.VERIFIED, dnsRecords: [] };
};
