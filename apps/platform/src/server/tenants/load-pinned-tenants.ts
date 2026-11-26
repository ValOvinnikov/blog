import 'server-only';

import {
  toPinnedTenant,
  type TPinnedTenant,
} from '@platform/utils/pinned-tenants/pinned-tenants';
import { queries } from '@shinefold/db';

export const loadPinnedTenants = async (
  adminId: string,
): Promise<TPinnedTenant[]> => {
  const rows = await queries.pinnedTenants.listPinnedTenants(adminId);

  return rows.map(toPinnedTenant);
};
