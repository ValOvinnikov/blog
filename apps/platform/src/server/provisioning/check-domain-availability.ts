import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';
import { DOMAIN_PATTERN } from '@platform/utils/path/path';
import { getDomain } from 'tldts';

export type TDomainAvailability =
  'NOT_CONFIGURED' | 'AVAILABLE' | 'IN_USE' | 'ERROR';

const VERCEL_TIMEOUT_MS = 5000;

// Every tenant domain on this platform lives under the same shared apex
// (map-domain.ts attaches all of them to the one shared apps/web Vercel
// project), so this apex's project-domains list grows by at least one
// entry per tenant and will genuinely paginate as the platform grows. Caps
// the round trips a single tenant-creation submission can incur: if a
// conclusive answer (a conflict, or the last page) isn't reached within
// this many pages, the check returns 'ERROR' rather than guessing
// 'AVAILABLE' — a false "no conflict" is worse than an inconclusive one,
// since 'ERROR' still just degrades to "can't tell, let creation proceed."
const MAX_PROJECT_DOMAINS_PAGES = 5;

type TProjectDomainsPage = {
  projectDomains?: { name: string; projectId: string }[];
  pagination?: { next: number | null };
};

/**
 * Vercel's project-domains-by-apex endpoint takes the registrable ("apex")
 * domain, not the full hostname — `blog-dev.valstack.dev` must be queried
 * as `valstack.dev`, and `blog.example.co.uk` as `example.co.uk`. Derived via
 * the public suffix list (`tldts`) rather than a labels-count heuristic,
 * since the suffix itself can be multi-part. Returns `null` when no
 * registrable domain can be determined (e.g. the input is itself a bare
 * public suffix).
 */
const deriveApexDomain = (domain: string): string | null => getDomain(domain);

// Vercel's own casing/trailing-dot normalization for a returned domain name
// isn't documented, so both sides are normalized the same way before
// comparing rather than assuming an exact match.
const normalizeDomainName = (name: string): string =>
  name.toLowerCase().replace(/\.$/, '');

const buildProjectDomainsUrl = (
  apexDomain: string,
  teamId: string | undefined,
  until: number | undefined,
): URL => {
  const url = new URL(
    `https://api.vercel.com/v1/domains/${encodeURIComponent(apexDomain)}/project-domains`,
  );
  if (teamId) url.searchParams.set('teamId', teamId);
  if (until !== undefined) url.searchParams.set('until', String(until));
  return url;
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

  if (!apexDomain) {
    logger.error('tenants.domain_availability_apex_undetermined', { domain });
    return 'ERROR';
  }

  const normalizedDomain = normalizeDomainName(domain);

  let until: number | undefined;

  try {
    for (let page = 0; page < MAX_PROJECT_DOMAINS_PAGES; page++) {
      const url = buildProjectDomainsUrl(apexDomain, teamId, until);

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(VERCEL_TIMEOUT_MS),
      });

      // A 404 means the apex itself is unknown to the team's Vercel
      // account — no project can have a domain registered under an apex
      // the account doesn't hold, so no conflict is possible.
      if (response.status === 404) return 'AVAILABLE';

      if (!response.ok) {
        logger.error('tenants.domain_availability_check_failed', {
          domain,
          responseStatus: response.status,
        });
        return 'ERROR';
      }

      const data = (await response.json()) as TProjectDomainsPage;

      const attachedElsewhere = data.projectDomains?.some(
        (projectDomain) =>
          normalizeDomainName(projectDomain.name) === normalizedDomain &&
          projectDomain.projectId !== webProjectId,
      );

      if (attachedElsewhere) return 'IN_USE';

      if (!data.pagination?.next) return 'AVAILABLE';

      until = data.pagination.next;
    }

    logger.warn('tenants.domain_availability_check_pagination_exhausted', {
      domain,
      maxPages: MAX_PROJECT_DOMAINS_PAGES,
    });
    return 'ERROR';
  } catch (error) {
    logger.error('tenants.domain_availability_check_error', {
      domain,
      error,
    });
    return 'ERROR';
  }
};
