import { Card } from '@platform/components/shared/card';
import type { TInboxLead } from '@platform/server/leads/to-inbox-lead';
import type { TMaybeUndefined } from '@shinefold/config';
import { type ReactNode, type Ref, useId } from 'react';

import { LeadRow } from './components/lead-row';
import { leadGroupVariants } from './lead-group-variants';

export type TLeadGroupProps = {
  title: string;
  leads: TInboxLead[];
  selectedId: TMaybeUndefined<string>;
  rowRef: (leadId: string) => Ref<HTMLButtonElement>;
  onOpen: (lead: TInboxLead) => void;
  footer?: ReactNode;
};

export const LeadGroup = ({
  title,
  leads,
  selectedId,
  rowRef,
  onOpen,
  footer,
}: TLeadGroupProps) => {
  const labelId = useId();
  const { root, label, list } = leadGroupVariants();

  return (
    <div className={root()}>
      <p id={labelId} className={label()}>
        {title}
      </p>
      <Card>
        <ul className={list()} aria-labelledby={labelId}>
          {leads.map((lead) => (
            <li key={lead.id}>
              <LeadRow
                ref={rowRef(lead.id)}
                lead={lead}
                isSelected={lead.id === selectedId}
                onOpen={onOpen}
              />
            </li>
          ))}
        </ul>
        {footer}
      </Card>
    </div>
  );
};
