import { env } from '@admin/utils/env/env';
import { logger } from '@admin/utils/logger/logger';
import { DOMAIN_PATTERN } from '@admin/utils/tenant-validation/tenant-validation';

export type TDomainVerificationStatus =
  'NOT_CONFIGURED' | 'NOT_ADDED' | 'PENDING' | 'VERIFIED' | 'ERROR';

const VERCEL_TIMEOUT_MS = 5000;

/**
 * Live, non-blocking DNS-verification check against Vercel's Domains API —
 * informational only: a tenant counts as provisioned once its domain is
 * added to the Vercel project, not once DNS actually verifies (that's
 * tenant-controlled and can take hours). Called on first render of the
 * tenant status page and, via `getDomainVerificationStatusAction`, polled
 * from the client afterward — both resolve `domain` from a tenant's own
 * database row, never from a caller argument, but `domain` is validated
 * and URL-encoded here too so this function stays safe for any future
 * caller, not just today's.
 */
export async function getDomainVerificationStatus(
  domain: string,
): Promise<TDomainVerificationStatus> {
  const {
    VERCEL_API_TOKEN: token,
    VERCEL_WEB_PROJECT_ID: projectId,
    VERCEL_TEAM_ID: teamId,
  } = env;

  if (!token || !projectId) return 'NOT_CONFIGURED';

  if (!DOMAIN_PATTERN.test(domain)) {
    logger.error('provisioning.domain_check_invalid_domain', { domain });
    return 'ERROR';
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

    if (response.status === 404) return 'NOT_ADDED';

    if (!response.ok) {
      logger.error('provisioning.domain_check_failed', {
        domain,
        responseStatus: response.status,
      });
      return 'ERROR';
    }

    const data = (await response.json()) as { verified?: boolean };
    return data.verified ? 'VERIFIED' : 'PENDING';
  } catch (error) {
    logger.error('provisioning.domain_check_error', { domain, error });
    return 'ERROR';
  }
}
