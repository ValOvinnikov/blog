import 'server-only';

import type { BILLING_LOG } from '@platform/constants/billing';
import type { TENANT_LOG } from '@platform/constants/tenant';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';
import type { TMaybeUndefined } from '@shinefold/config';
import type { TValueOf } from '@shinefold/config/utils';
import { queries } from '@shinefold/db';
import type { TTenant } from '@shinefold/db/schema/tenants';

export type TOwnerEmailRecipient = {
  from: string;
  tenant: TTenant;
  ownerEmail: string;
};

type TOwnerEmailSkipEvent =
  TValueOf<typeof BILLING_LOG> | TValueOf<typeof TENANT_LOG>;

type TOwnerEmailSkipLog = {
  unconfigured: TOwnerEmailSkipEvent;
  ownerMissing: TOwnerEmailSkipEvent;
};

export const loadOwnerEmailRecipient = async (
  tenantId: string,
  skipLog: TOwnerEmailSkipLog,
): Promise<TMaybeUndefined<TOwnerEmailRecipient>> => {
  const from = env.OWNER_EMAIL_FROM_ADDRESS;
  if (!from) {
    logger.warn(skipLog.unconfigured, { tenantId });
    return undefined;
  }

  const [tenant, ownerEmail] = await Promise.all([
    queries.tenants.getTenantById(tenantId),
    queries.memberships.getTenantOwnerEmail(tenantId),
  ]);
  if (!tenant || !ownerEmail) {
    logger.warn(skipLog.ownerMissing, { tenantId });
    return undefined;
  }

  return { from, tenant, ownerEmail };
};
