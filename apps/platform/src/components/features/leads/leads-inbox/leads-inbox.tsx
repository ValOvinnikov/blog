'use client';

import { hasArrayGotItems, isUndefined } from '@blog/utils/primitives';
import type { TInboxLeadsPage } from '@platform/server/leads/list-inbox-leads';
import { tv } from '@platform/utils/tv/tv';

import { LeadReadingPane } from './components/lead-reading-pane';
import { LeadsList } from './components/leads-list';
import { NoLeadSelected } from './components/no-lead-selected';
import { useLeadSelection } from './use-lead-selection';
import { useLeadsPages } from './use-leads-pages';

const leadsInboxVariants = tv({
  slots: {
    root: ['grid grid-cols-1 items-start gap-6 lg:grid-cols-2'],
    listColumn: [
      'min-w-0 rounded-admin',
      'outline-hidden focus-visible:ring-2 focus-visible:ring-admin-brand focus-visible:ring-offset-2',
    ],
    paneColumn: [
      'min-w-0',
      'lg:sticky lg:top-admin-topbar lg:max-h-[calc(100dvh-160px)] lg:self-start lg:overflow-y-auto lg:overscroll-contain',
    ],
  },
  variants: {
    hasSelection: {
      true: { listColumn: ['hidden lg:block'] },
      false: { paneColumn: ['hidden lg:block'] },
    },
  },
});

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
