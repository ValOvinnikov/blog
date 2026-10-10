'use server';

import { queries } from '@blog/db';
import type { TFinding } from '@blog/db/schema/findings';
import { requireTenantById } from '@platform/server/auth/require-tenant-by-id';

export const getFindingDetailsAction = async (
  tenantId: string,
  findingId: string,
): Promise<TFinding['details']> => {
  await requireTenantById(tenantId);

  return queries.findings.getFindingDetails(tenantId, findingId);
};
