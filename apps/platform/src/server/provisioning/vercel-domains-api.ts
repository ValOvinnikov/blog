import { DOMAIN_PATTERN } from '@blog/config';
import { HTTP_STATUS } from '@blog/config/constants';
import {
  DOMAIN_VERIFICATION_STATUS,
  type TDomainVerificationStatus,
} from '@platform/constants/domain';
import { PROVISIONING_LOG } from '@platform/constants/provisioning';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';

import { fetchVercel, readVercelCredentials } from './vercel-client';
import { getDomainRouting } from './vercel-domain-routing';

export type TDomainDnsRecord = {
  type: string;
  name: string;
  value: string;
};

export type TProjectDomain = {
  status: TDomainVerificationStatus;
  dnsRecords: TDomainDnsRecord[];
};

type TVercelProjectDomainResponse = {
  name?: string;
  apexName?: string;
  verified?: boolean;
  verification?: { type: string; domain: string; value: string }[];
};

const projectDomain = (
  status: TDomainVerificationStatus,
  dnsRecords: TDomainDnsRecord[] = [],
): TProjectDomain => ({ status, dnsRecords });

export const getProjectDomain = async (
  domain: string,
): Promise<TProjectDomain> => {
  const credentials = readVercelCredentials();

  if (!credentials)
    return projectDomain(DOMAIN_VERIFICATION_STATUS.NOT_CONFIGURED);

  if (!DOMAIN_PATTERN.test(domain)) {
    logger.error(PROVISIONING_LOG.DOMAIN_CHECK_INVALID_DOMAIN, { domain });
    return projectDomain(DOMAIN_VERIFICATION_STATUS.ERROR);
  }

  try {
    const response = await fetchVercel(
      credentials,
      `/v9/projects/${credentials.projectId}/domains/${encodeURIComponent(domain)}`,
    );

    if (response.status === HTTP_STATUS.NOT_FOUND)
      return projectDomain(DOMAIN_VERIFICATION_STATUS.NOT_ADDED);

    if (!response.ok) {
      logger.error(PROVISIONING_LOG.DOMAIN_CHECK_FAILED, {
        domain,
        responseStatus: response.status,
      });
      return projectDomain(DOMAIN_VERIFICATION_STATUS.ERROR);
    }

    const {
      name,
      apexName,
      verified,
      verification = [],
    } = (await response.json()) as TVercelProjectDomainResponse;

    if (!verified) {
      return projectDomain(
        DOMAIN_VERIFICATION_STATUS.PENDING,
        verification.map(({ type, domain: recordName, value }) => ({
          type,
          name: recordName,
          value,
        })),
      );
    }

    return await getDomainRouting(
      credentials,
      domain,
      (name ?? domain) === apexName,
    );
  } catch (error) {
    logger.error(PROVISIONING_LOG.DOMAIN_CHECK_ERROR, {
      domain,
      ...toLoggableError(error),
    });
    return projectDomain(DOMAIN_VERIFICATION_STATUS.ERROR);
  }
};
