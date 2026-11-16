'use server';

import { requireTenantById } from '@platform/server/auth/require-tenant-by-id';
import { queries } from '@shinefold/db';
import type { TFinding } from '@shinefold/db/schema/findings';

export const getFindingDetailsAction = async (
  tenantId: string,
  findingId: string,
): Promise<TFinding['details']> => {
  await requireTenantById(tenantId);

  return queries.findings.getFindingDetails(tenantId, findingId);
};
