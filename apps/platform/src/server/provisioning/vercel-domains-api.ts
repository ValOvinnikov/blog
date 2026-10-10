import { DOMAIN_PATTERN } from '@blog/config';
import {
  DOMAIN_VERIFICATION_STATUS,
  type TDomainVerificationStatus,
} from '@platform/constants/domain';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';

export type TDomainDnsRecord = {
  type: string;
  name: string;
  value: string;
};

export type TProjectDomain = {
  status: TDomainVerificationStatus;
  dnsRecords: TDomainDnsRecord[];
};

type TVercelCredentials = {
  token: string;
  projectId: string;
  teamId: string | undefined;
};

type TVercelProjectDomainResponse = {
  verified?: boolean;
  verification?: { type: string; domain: string; value: string }[];
};

const VERCEL_API_ORIGIN = 'https://api.vercel.com';

const VERCEL_TIMEOUT_MS = 5000;

export const readVercelCredentials = (): TVercelCredentials | undefined => {
  const {
    VERCEL_API_TOKEN: token,
    VERCEL_PROJECT_ID_WEB: projectId,
    VERCEL_TEAM_ID: teamId,
  } = env;

  return token && projectId ? { token, projectId, teamId } : undefined;
};

export const fetchVercel = (
  { token, teamId }: TVercelCredentials,
  path: string,
  searchParams: Record<string, string> = {},
): Promise<Response> => {
  const url = new URL(path, VERCEL_API_ORIGIN);
  if (teamId) url.searchParams.set('teamId', teamId);
  for (const [name, value] of Object.entries(searchParams)) {
    url.searchParams.set(name, value);
  }

  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(VERCEL_TIMEOUT_MS),
  });
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
    logger.error('provisioning.domain_check_invalid_domain', { domain });
    return projectDomain(DOMAIN_VERIFICATION_STATUS.ERROR);
  }

  try {
    const response = await fetchVercel(
      credentials,
      `/v9/projects/${credentials.projectId}/domains/${encodeURIComponent(domain)}`,
    );

    if (response.status === 404)
      return projectDomain(DOMAIN_VERIFICATION_STATUS.NOT_ADDED);

    if (!response.ok) {
      logger.error('provisioning.domain_check_failed', {
        domain,
        responseStatus: response.status,
      });
      return projectDomain(DOMAIN_VERIFICATION_STATUS.ERROR);
    }

    const { verified, verification = [] } =
      (await response.json()) as TVercelProjectDomainResponse;

    if (verified) return projectDomain(DOMAIN_VERIFICATION_STATUS.VERIFIED);

    return projectDomain(
      DOMAIN_VERIFICATION_STATUS.PENDING,
      verification.map(({ type, domain: name, value }) => ({
        type,
        name,
        value,
      })),
    );
  } catch (error) {
    logger.error('provisioning.domain_check_error', { domain, error });
    return projectDomain(DOMAIN_VERIFICATION_STATUS.ERROR);
  }
};
