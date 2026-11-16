import 'server-only';

import type { TMaybeUndefined } from '@shinefold/config';
import { queries } from '@shinefold/db';
import type { TLeadsCursor } from '@shinefold/db/queries/leads';

import { toInboxLead, type TInboxLead } from './to-inbox-lead';

export type TInboxLeadsPage = {
  leads: TInboxLead[];
  nextCursor: TMaybeUndefined<TLeadsCursor>;
};

export const listInboxLeads = async (
  tenantId: string,
  after?: TLeadsCursor,
): Promise<TInboxLeadsPage> => {
  const { leads, nextCursor } = await queries.leads.listLeadsByCursor({
    tenantId,
    after,
  });

  return { leads: leads.map(toInboxLead), nextCursor };
};
