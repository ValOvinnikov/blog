import { env } from '@admin/utils/env/env';
import { logger } from '@admin/utils/logger/logger';
import { DOMAIN_PATTERN } from '@admin/utils/path/path';

export type TDomainDnsRecord = {
  type: string;
  name: string;
  value: string;
};

const VERCEL_TIMEOUT_MS = 5000;

type TVercelDomainResponse = {
  verified?: boolean;
  verification?: { type: string; domain: string; value: string }[];
};

/**
 * The DNS records still outstanding for a tenant's domain, read from
 * Vercel's own `verification` challenge list — a second call to the same
 * Domains API `getDomainVerificationStatus` already hits, kept as its own
 * request rather than folded into that function's return shape so its
 * several existing callers (all of which only need the bare status) stay
 * untouched. Returns `undefined` once Vercel reports the domain verified
 * (nothing left to configure) or whenever the records can't be determined.
 */
export const getDomainDnsRecords = async (
  domain: string,
): Promise<TDomainDnsRecord[] | undefined> => {
  const {
    VERCEL_API_TOKEN: token,
    VERCEL_WEB_PROJECT_ID: projectId,
    VERCEL_TEAM_ID: teamId,
  } = env;

  if (!token || !projectId) return undefined;

  if (!DOMAIN_PATTERN.test(domain)) {
    logger.error('provisioning.domain_dns_records_invalid_domain', {
      domain,
    });
    return undefined;
  }

  const url = new URL(
    `https://api.vercel.com/v9/projects/${projectId}/domains/${encodeURIComponent(domain)}`,
  );
  if (teamId) url.searchParams.set('teamId', teamId);

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(VERCEL_TIMEOUT_MS),
    });

    if (response.status === 404) return undefined;

    if (!response.ok) {
      logger.error('provisioning.domain_dns_records_failed', {
        domain,
        responseStatus: response.status,
      });
      return undefined;
    }

    const data = (await response.json()) as TVercelDomainResponse;

    if (data.verified) return undefined;

    return (data.verification ?? []).map((record) => ({
      type: record.type,
      name: record.domain,
      value: record.value,
    }));
  } catch (error) {
    logger.error('provisioning.domain_dns_records_error', { domain, error });
    return undefined;
  }
};
