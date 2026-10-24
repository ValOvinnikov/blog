import { useLeadsTenantId } from '@platform/components/features/leads/leads-tenant-provider';
import type { TInboxLeadsPage } from '@platform/server/leads/list-inbox-leads';
import { loadMoreLeadsAction } from '@platform/server/leads/load-more-leads-action';
import type { TInboxLead } from '@platform/server/leads/to-inbox-lead';
import { useState, useTransition } from 'react';

export const useLeadsPages = (initialPage: TInboxLeadsPage) => {
  const tenantId = useLeadsTenantId();
  const [leads, setLeads] = useState(initialPage.leads);
  const [nextCursor, setNextCursor] = useState(initialPage.nextCursor);
  const [hasLoadFailed, setHasLoadFailed] = useState(false);
  const [isLoading, startLoading] = useTransition();

  const loadMore = () => {
    if (!nextCursor || isLoading) return;
    setHasLoadFailed(false);
    startLoading(async () => {
      const result = await loadMoreLeadsAction(tenantId, nextCursor);
      if (!result.isLoaded) {
        setHasLoadFailed(true);
        return;
      }
      const { leads: loaded, nextCursor: next } = result.page;
      setLeads((current) => [
        ...current,
        ...loaded.filter(({ id }) => !current.some((lead) => lead.id === id)),
      ]);
      setNextCursor(next);
    });
  };

  const updateLead = (id: string, change: Partial<TInboxLead>) =>
    setLeads((current) =>
      current.map((lead) => (lead.id === id ? { ...lead, ...change } : lead)),
    );

  const removeLead = (id: string) =>
    setLeads((current) => current.filter((lead) => lead.id !== id));

  return {
    leads,
    loading: {
      hasMore: nextCursor !== undefined,
      isLoading,
      hasLoadFailed,
      loadMore,
    },
    updateLead,
    removeLead,
  };
};

export type TLeadsLoading = ReturnType<typeof useLeadsPages>['loading'];
