'use server';

import { SUBSCRIBER_OUTCOME } from '@blog/config';
import { queries } from '@blog/db';
import { auth } from '@web/server/auth/auth';
import { getRequestTenantId } from '@web/server/tenant/request-tenant/request-tenant';

export const isReaderSubscribedToNewsletter = async (): Promise<boolean> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return false;

  const tenantId = await getRequestTenantId();
  if (!tenantId) return false;

  const status = await queries.subscribers.getSubscriptionStatus(
    tenantId,
    userId,
  );
  return status.outcome !== SUBSCRIBER_OUTCOME.NOT_SUBSCRIBED;
};
