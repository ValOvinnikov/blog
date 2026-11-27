import 'server-only';

import {
  requireTenantById,
  type TTenantByIdContext,
} from '@platform/server/auth/require-tenant-by-id';
import { notFound } from 'next/navigation';

import { canOperatorOpenSubscribers } from './can-operator-open-subscribers';

export const requireOperatorSubscribersTenant = async (
  tenantId: string,
): Promise<TTenantByIdContext> => {
  const context = await requireTenantById(tenantId);

  if (!canOperatorOpenSubscribers(context.tenant, context.viewer)) notFound();

  return context;
};
