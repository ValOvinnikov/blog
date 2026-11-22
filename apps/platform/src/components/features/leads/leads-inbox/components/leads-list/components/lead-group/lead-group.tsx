import type { TLeadSelection } from '@platform/components/features/leads/leads-inbox/use-lead-selection';
import type { TLeadsLoading } from '@platform/components/features/leads/leads-inbox/use-leads-pages';
import { Card } from '@platform/components/shared/card';
import { SectionLabel } from '@platform/components/shared/section-label';
import type { TInboxLead } from '@platform/server/leads/to-inbox-lead';
import { useId } from 'react';

import { LeadRow } from './components/lead-row';
import { LoadMoreFooter } from './components/load-more-footer';
import { leadGroupVariants } from './lead-group-variants';

export type TLeadGroupProps = {
  title: string;
  leads: TInboxLead[];
  selection: TLeadSelection;
  loading?: TLeadsLoading;
};

export const LeadGroup = ({
  title,
  leads,
  selection,
  loading,
}: TLeadGroupProps) => {
  const labelId = useId();
  const { selectedId, rowRef, open } = selection;
  const { root, list } = leadGroupVariants();

  return (
    <div className={root()}>
      <SectionLabel id={labelId}>{title}</SectionLabel>
      <Card>
        <ul className={list()} aria-labelledby={labelId}>
          {leads.map((lead) => (
            <li key={lead.id}>
              <LeadRow
                ref={rowRef(lead.id)}
                lead={lead}
                isSelected={lead.id === selectedId}
                onOpen={open}
              />
            </li>
          ))}
        </ul>
        {loading && <LoadMoreFooter loading={loading} />}
      </Card>
    </div>
  );
};
