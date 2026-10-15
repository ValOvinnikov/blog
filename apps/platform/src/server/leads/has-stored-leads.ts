import 'server-only';

import { queries } from '@blog/db';
import { cache } from 'react';

export const hasStoredLeads = cache(async (tenantId: string) => {
  const { total } = await queries.leads.listLeads({
    tenantId,
    page: 1,
    pageSize: 1,
  });

  return total > 0;
});
