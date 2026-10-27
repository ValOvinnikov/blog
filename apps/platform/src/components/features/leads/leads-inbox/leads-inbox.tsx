'use client';

import { hasArrayGotItems, isUndefined } from '@blog/utils/primitives';
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
  const {
    selectedId,
    paneHeadingRef,
    listRef,
    rowRef,
    open,
    markUnread,
    close,
    handleDeleted,
  } = useLeadSelection({ leads, updateLead, removeLead });
  const selectedLead = leads.find(({ id }) => id === selectedId);
  const { root, listColumn, paneColumn } = leadsInboxVariants({
    hasSelection: !isUndefined(selectedLead),
  });

  return (
    <div className={root()}>
      <div
        ref={listRef}
        tabIndex={-1}
        className={listColumn()}
        data-testid="leads-list-column"
      >
        <LeadsList
          leads={leads}
          selectedId={selectedId}
          rowRef={rowRef}
          onOpen={open}
          loading={loading}
        />
      </div>
      {hasArrayGotItems(leads) && (
        <div className={paneColumn()}>
          {selectedLead ? (
            <LeadReadingPane
              lead={selectedLead}
              headingRef={paneHeadingRef}
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
