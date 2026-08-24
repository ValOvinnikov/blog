import { env } from '@admin/utils/env/env';
import { logger } from '@admin/utils/logger/logger';
import { DOMAIN_PATTERN } from '@admin/utils/path/path';

export type TDomainAvailability =
  'NOT_CONFIGURED' | 'AVAILABLE' | 'IN_USE' | 'ERROR';

const VERCEL_TIMEOUT_MS = 5000;

/**
 * Vercel's project-domains-by-apex endpoint takes the registrable ("apex")
 * domain, not the full hostname — `blog-dev.valstack.dev` must be queried
 * as `valstack.dev`. This is a last-two-labels heuristic, not a public
 * suffix list lookup: it is wrong for a domain under a multi-part public
 * suffix (`example.co.uk` would derive `co.uk`, not `example.co.uk`).
 * Acceptable here because the check is advisory and every failure mode
 * (including a wrong apex returning no match) degrades to "can't tell, let
 * creation proceed" rather than a false block.
 */
const deriveApexDomain = (domain: string): string => {
  const labels = domain.split('.');
  return labels.slice(-2).join('.');
};

/**
 * Advisory pre-check run at tenant-creation time, before provisioning ever
 * starts. Mirrors the rule `mapTenantDomain` (`packages/db`) enforces at
 * provisioning step 5: every tenant domain is added to the one shared
 * `apps/web` Vercel project, so a domain already attached to any *other*
 * project can never be mapped there and would wedge the tenant partway
 * through provisioning. Never a hard blocker — absent credentials, an
 * invalid domain, or any request failure all resolve to a status the
 * caller treats as "can't tell, let creation proceed."
 */
export const checkDomainAvailability = async (
  domain: string,
): Promise<TDomainAvailability> => {
  const {
    VERCEL_API_TOKEN: token,
    VERCEL_WEB_PROJECT_ID: webProjectId,
    VERCEL_TEAM_ID: teamId,
  } = env;

  if (!token || !webProjectId) return 'NOT_CONFIGURED';

  if (!DOMAIN_PATTERN.test(domain)) {
    logger.error('tenants.domain_availability_invalid_domain', { domain });
    return 'ERROR';
  }

  const apexDomain = deriveApexDomain(domain);

  const url = new URL(
    `https://api.vercel.com/v1/domains/${encodeURIComponent(apexDomain)}/project-domains`,
  );
  if (teamId) url.searchParams.set('teamId', teamId);

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(VERCEL_TIMEOUT_MS),
    });

    // A 404 means the apex itself is unknown to the team's Vercel account —
    // no project can have a domain registered under an apex the account
    // doesn't hold, so no conflict is possible.
    if (response.status === 404) return 'AVAILABLE';

    if (!response.ok) {
      logger.error('tenants.domain_availability_check_failed', {
        domain,
        responseStatus: response.status,
      });
      return 'ERROR';
    }

    const data = (await response.json()) as {
      projectDomains?: { name: string; projectId: string }[];
    };

    const attachedElsewhere = data.projectDomains?.some(
      (projectDomain) =>
        projectDomain.name === domain &&
        projectDomain.projectId !== webProjectId,
    );

    return attachedElsewhere ? 'IN_USE' : 'AVAILABLE';
  } catch (error) {
    logger.error('tenants.domain_availability_check_error', {
      domain,
      error,
    });
    return 'ERROR';
  }
};
