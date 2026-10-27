import { DOMAIN_PATTERN, type TMaybeNull } from '@blog/config';
import { HTTP_STATUS } from '@blog/config/constants';
import { isUndefined } from '@blog/utils/primitives';
import {
  DOMAIN_AVAILABILITY,
  type TDomainAvailability,
} from '@platform/constants/domain';
import { TENANT_LOG } from '@platform/constants/tenant';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { getDomain } from 'tldts';

import { fetchVercel, readVercelCredentials } from './vercel-domains-api';

// Every tenant domain shares one apex, so its list paginates; past this cap the check returns ERROR rather than guess AVAILABLE.
const MAX_PROJECT_DOMAINS_PAGES = 5;

type TProjectDomainsPage = {
  projectDomains?: { name: string; projectId: string }[];
  pagination?: { next: TMaybeNull<number> };
};

// The suffix can be multi-part (`example.co.uk`), so the apex comes from the public suffix list, not a label count.
const deriveApexDomain = (domain: string): TMaybeNull<string> =>
  getDomain(domain);

// Vercel does not document how it normalises a returned domain name.
const normalizeDomainName = (name: string): string =>
  name.toLowerCase().replace(/\.$/, '');

/** Advisory, never a hard blocker: a domain attached to another Vercel project would wedge provisioning partway through. */
export const checkDomainAvailability = async (
  domain: string,
): Promise<TDomainAvailability> => {
  const credentials = readVercelCredentials();

  if (!credentials) return DOMAIN_AVAILABILITY.NOT_CONFIGURED;

  if (!DOMAIN_PATTERN.test(domain)) {
    logger.error(TENANT_LOG.DOMAIN_AVAILABILITY_INVALID_DOMAIN, { domain });
    return DOMAIN_AVAILABILITY.ERROR;
  }

  const apexDomain = deriveApexDomain(domain);

  if (!apexDomain) {
    logger.error(TENANT_LOG.DOMAIN_AVAILABILITY_APEX_UNDETERMINED, { domain });
    return DOMAIN_AVAILABILITY.ERROR;
  }

  const normalizedDomain = normalizeDomainName(domain);

  let until: number | undefined;

  try {
    for (let page = 0; page < MAX_PROJECT_DOMAINS_PAGES; page++) {
      const response = await fetchVercel(
        credentials,
        `/v1/domains/${encodeURIComponent(apexDomain)}/project-domains`,
        isUndefined(until) ? {} : { until: String(until) },
      );

      // A 404 means the team's account holds no domain under this apex.
      if (response.status === HTTP_STATUS.NOT_FOUND)
        return DOMAIN_AVAILABILITY.AVAILABLE;

      if (!response.ok) {
        logger.error(TENANT_LOG.DOMAIN_AVAILABILITY_CHECK_FAILED, {
          domain,
          responseStatus: response.status,
        });
        return DOMAIN_AVAILABILITY.ERROR;
      }

      const data = (await response.json()) as TProjectDomainsPage;

      const attachedElsewhere = data.projectDomains?.some(
        (projectDomain) =>
          normalizeDomainName(projectDomain.name) === normalizedDomain &&
          projectDomain.projectId !== credentials.projectId,
      );

      if (attachedElsewhere) return DOMAIN_AVAILABILITY.IN_USE;

      if (!data.pagination?.next) return DOMAIN_AVAILABILITY.AVAILABLE;

      until = data.pagination.next;
    }

    logger.warn(TENANT_LOG.DOMAIN_AVAILABILITY_CHECK_PAGINATION_EXHAUSTED, {
      domain,
      maxPages: MAX_PROJECT_DOMAINS_PAGES,
    });
    return DOMAIN_AVAILABILITY.ERROR;
  } catch (error) {
    logger.error(TENANT_LOG.DOMAIN_AVAILABILITY_CHECK_ERROR, {
      domain,
      ...toLoggableError(error),
    });
    return DOMAIN_AVAILABILITY.ERROR;
  }
};
