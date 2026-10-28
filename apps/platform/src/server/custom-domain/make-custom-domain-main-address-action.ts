'use server';

import { ACTION_OUTCOME, type TActionResult } from '@blog/config';
import { queries } from '@blog/db';
import { TENANT_PLAN } from '@blog/db/constants';
import { toOutcome } from '@blog/utils/to-outcome';
import {
  CUSTOM_DOMAIN_LOG,
  CUSTOM_DOMAIN_REFUSAL,
  type TCustomDomainRefusal,
} from '@platform/constants/custom-domain';
import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import { requireTenantOwner } from '@platform/server/auth/require-tenant-owner';
import { getProjectDomain } from '@platform/server/provisioning/vercel-domains-api';
import { env } from '@platform/utils/env/env';
import { findCustomDomain } from '@platform/utils/find-custom-domain/find-custom-domain';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';

import {
  customDomainInputSchema,
  type TCustomDomainInput,
} from './custom-domain-input';
import { switchMainAddress } from './switch-main-address';

export type TMakeCustomDomainMainAddressResult = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  'domain',
  never,
  TCustomDomainRefusal
>;

const refused = (
  reason: TCustomDomainRefusal,
): TMakeCustomDomainMainAddressResult => ({
  outcome: ACTION_OUTCOME.REFUSED,
  reason,
});

export const makeCustomDomainMainAddressAction = async (
  tenantId: string,
  input: TCustomDomainInput,
): Promise<TMakeCustomDomainMainAddressResult> => {
  const { tenant } = await requireTenantOwner(tenantId);

  const parsed = customDomainInputSchema.safeParse(input);
  if (!parsed.success) {
    return { outcome: ACTION_OUTCOME.INVALID, fieldErrors: {} };
  }
  const { domain } = parsed.data;
  const { id, plan, deprovisionedAt, primaryDomain } = tenant;

  if (deprovisionedAt) return refused(CUSTOM_DOMAIN_REFUSAL.ARCHIVED);
  if (plan !== TENANT_PLAN.GROWTH) {
    return refused(CUSTOM_DOMAIN_REFUSAL.NOT_ON_PLAN);
  }

  try {
    const customDomain = findCustomDomain(
      await queries.tenantDomains.listTenantDomains(id),
      primaryDomain,
      env.TENANT_ROOT_DOMAIN,
    );
    if (domain !== customDomain) {
      return refused(CUSTOM_DOMAIN_REFUSAL.NOT_CUSTOM_DOMAIN);
    }

    const { status } = await getProjectDomain(domain);
    if (status !== DOMAIN_VERIFICATION_STATUS.VERIFIED) {
      return refused(CUSTOM_DOMAIN_REFUSAL.NOT_VERIFIED);
    }

    return await switchMainAddress({
      tenantId: id,
      from: primaryDomain,
      to: domain,
    });
  } catch (error) {
    logger.error(CUSTOM_DOMAIN_LOG.MAIN_ADDRESS_FAILED, {
      tenantId: id,
      domain,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
