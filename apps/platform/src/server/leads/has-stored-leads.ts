import 'server-only';

import { queries } from '@shinefold/db';
import { cache } from 'react';

export const hasStoredLeads = cache(
  async (tenantId: string) =>
    (await queries.leads.countLeadsForTenant(tenantId)) > 0,
);
