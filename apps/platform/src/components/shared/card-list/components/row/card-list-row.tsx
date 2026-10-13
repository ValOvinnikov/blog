import {
  cardListVariants,
  type TCardListVariants,
} from '@platform/components/shared/card-list/card-list-variants';
import { CardListFooter } from '@platform/components/shared/card-list/components/footer/card-list-footer';
import { CardListLead } from '@platform/components/shared/card-list/components/lead/card-list-lead';
import { CardListPrimary } from '@platform/components/shared/card-list/components/primary/card-list-primary';
import { CardListSecondary } from '@platform/components/shared/card-list/components/secondary/card-list-secondary';
import { CardListTime } from '@platform/components/shared/card-list/components/time/card-list-time';
import { mapCompoundSlots, type TCompoundChildren } from '@platform/lib/react';
import { type ElementType, Fragment } from 'react';

const CardListRowParts = {
  Lead: CardListLead,
  Primary: CardListPrimary,
  Secondary: CardListSecondary,
  Footer: CardListFooter,
  Time: CardListTime,
} satisfies Record<string, ElementType>;

export type TCardListRowProps = {
  align?: TCardListVariants['align'];
  children: TCompoundChildren<typeof CardListRowParts>;
};

export const CardListRow = ({ align, children }: TCardListRowProps) => {
  const { row, body } = cardListVariants({ align });
  const { slots, unmatched } = mapCompoundSlots(children, CardListRowParts);

  return (
    <div className={row()}>
      {slots.Lead}
      <div className={body()}>
        {slots.Primary}
        {slots.Secondary}
        {slots.Footer}
      </div>
      {slots.Time}
      {unmatched.map((node, i) => (
        <Fragment key={i}>{node}</Fragment>
      ))}
    </div>
  );
};
