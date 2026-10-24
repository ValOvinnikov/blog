'use client';

import type { TInboxLeadsPage } from '@platform/server/leads/list-inbox-leads';

import { LeadReadingPane } from './components/lead-reading-pane';
import { LeadsList } from './components/leads-list';
import { NoLeadSelected } from './components/no-lead-selected';
import { leadsInboxVariants } from './leads-inbox-variants';
import { useLeadSelection } from './use-lead-selection';
import { useLeadsPages } from './use-leads-pages';

export type TLeadsInboxProps = {
  initialPage: TInboxLeadsPage;
};

export const LeadsInbox = ({ initialPage }: TLeadsInboxProps) => {
  const { leads, loading, updateLead, removeLead } = useLeadsPages(initialPage);
  const { selectedId, open, markUnread, close, handleDeleted } =
    useLeadSelection({ updateLead, removeLead });
  const selectedLead = leads.find(({ id }) => id === selectedId);
  const { root, listColumn, paneColumn } = leadsInboxVariants({
    hasSelection: selectedLead !== undefined,
  });

  return (
    <div className={root()}>
      <div className={listColumn()}>
        <LeadsList
          leads={leads}
          selectedId={selectedId}
          onOpen={open}
          loading={loading}
        />
      </div>
      {leads.length > 0 && (
        <div className={paneColumn()}>
          {selectedLead ? (
            <LeadReadingPane
              lead={selectedLead}
              onBack={close}
              onMarkUnread={markUnread}
              onDeleted={handleDeleted}
            />
          ) : (
            <NoLeadSelected />
          )}
        </div>
      )}
    </div>
  );
};
