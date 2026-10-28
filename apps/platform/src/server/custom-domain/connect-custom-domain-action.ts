'use server';

import { ACTION_OUTCOME, ERROR_CODE, type TActionResult } from '@blog/config';
import { queries } from '@blog/db';
import { TENANT_PLAN } from '@blog/db/constants';
import { toOutcome } from '@blog/utils/to-outcome';
import {
  CUSTOM_DOMAIN_FIELD_ERROR,
  CUSTOM_DOMAIN_LOG,
  CUSTOM_DOMAIN_REFUSAL,
  type TCustomDomainFieldError,
  type TCustomDomainRefusal,
} from '@platform/constants/custom-domain';
import { requireTenantOwner } from '@platform/server/auth/require-tenant-owner';
import { env } from '@platform/utils/env/env';
import { isCustomDomain } from '@platform/utils/is-custom-domain/is-custom-domain';
import { isReservedDomain } from '@platform/utils/is-reserved-domain/is-reserved-domain';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';

import {
  customDomainInputSchema,
  type TCustomDomainInput,
} from './custom-domain-input';

export type TConnectCustomDomainResult = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  'domain',
  TCustomDomainFieldError,
  TCustomDomainRefusal
>;

const fieldError = (
  reason: TCustomDomainFieldError,
): TConnectCustomDomainResult => ({
  outcome: ACTION_OUTCOME.INVALID,
  fieldErrors: { domain: { reason } },
});

const refused = (reason: TCustomDomainRefusal): TConnectCustomDomainResult => ({
  outcome: ACTION_OUTCOME.REFUSED,
  reason,
});

export const connectCustomDomainAction = async (
  tenantId: string,
  input: TCustomDomainInput,
): Promise<TConnectCustomDomainResult> => {
  const { tenant } = await requireTenantOwner(tenantId);

  const parsed = customDomainInputSchema.safeParse(input);
  if (!parsed.success) {
    return fieldError(CUSTOM_DOMAIN_FIELD_ERROR.DOMAIN_INVALID);
  }
  const { domain } = parsed.data;
  const { id, plan, deprovisionedAt, sanityProjectId, primaryDomain } = tenant;

  if (deprovisionedAt) return refused(CUSTOM_DOMAIN_REFUSAL.ARCHIVED);
  if (plan !== TENANT_PLAN.GROWTH) {
    return refused(CUSTOM_DOMAIN_REFUSAL.NOT_ON_PLAN);
  }
  if (!sanityProjectId) return refused(CUSTOM_DOMAIN_REFUSAL.NOT_PROVISIONED);
  const rootDomain = env.TENANT_ROOT_DOMAIN;
  if (!rootDomain) {
    logger.error(CUSTOM_DOMAIN_LOG.ROOT_DOMAIN_MISSING, { tenantId: id });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
  const { WEB_APP_URL: webAppUrl, PLATFORM_APP_BASE_URL: platformAppUrl } = env;
  if (!webAppUrl || !platformAppUrl) {
    logger.error(CUSTOM_DOMAIN_LOG.APP_URL_MISSING, {
      tenantId: id,
      missing: [
        ...(webAppUrl ? [] : ['WEB_APP_URL']),
        ...(platformAppUrl ? [] : ['PLATFORM_APP_BASE_URL']),
      ],
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
  if (isReservedDomain(domain, rootDomain, [webAppUrl, platformAppUrl])) {
    return fieldError(CUSTOM_DOMAIN_FIELD_ERROR.DOMAIN_PLATFORM_ADDRESS);
  }

  try {
    if (await queries.tenantDomains.isDomainHeldByAnyTenant(domain)) {
      return fieldError(CUSTOM_DOMAIN_FIELD_ERROR.DOMAIN_TAKEN);
    }

    const hosts = [
      primaryDomain,
      ...(await queries.tenantDomains.listTenantDomains(id)).map(
        (row) => row.domain,
      ),
    ];
    if (hosts.some((host) => isCustomDomain(host, rootDomain))) {
      return refused(CUSTOM_DOMAIN_REFUSAL.ALREADY_CONNECTED);
    }

    const claimed = await queries.customDomainClaims.createCustomDomainClaim(
      id,
      domain,
    );
    if (!claimed.ok) {
      if (claimed.error === ERROR_CODE.DB_DOMAIN_CLAIM_EXISTS) {
        return refused(CUSTOM_DOMAIN_REFUSAL.CLAIM_PENDING);
      }
      if (claimed.error === ERROR_CODE.DB_INVALID_DOMAIN) {
        return fieldError(CUSTOM_DOMAIN_FIELD_ERROR.DOMAIN_INVALID);
      }
      logger.error(CUSTOM_DOMAIN_LOG.CONNECT_FAILED, {
        tenantId: id,
        domain,
        error: claimed.error,
      });
      return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
    }

    return toOutcome(ACTION_OUTCOME.SUCCESS);
  } catch (error) {
    logger.error(CUSTOM_DOMAIN_LOG.CONNECT_FAILED, {
      tenantId: id,
      domain,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
