import {
  cardListVariants,
  type TCardListVariants,
} from '@platform/components/shared/card-list/card-list-variants';
import type { ReactNode } from 'react';

type TCardListRowTime = {
  date: Date;
  label: string;
};

export type TCardListRowProps = {
  lead: ReactNode;
  primary: string;
  secondary: string;
  time: TCardListRowTime;
  align?: TCardListVariants['align'];
  children?: ReactNode;
};

export const CardListRow = ({
  lead,
  primary,
  secondary,
  time,
  align,
  children,
}: TCardListRowProps) => {
  const {
    row,
    body,
    primary: primarySlot,
    secondary: secondarySlot,
    time: timeSlot,
  } = cardListVariants({ align });

  return (
    <div className={row()}>
      {lead}
      <div className={body()}>
        <span className={primarySlot()}>{primary}</span>
        <span className={secondarySlot()}>{secondary}</span>
        {children}
      </div>
      <time dateTime={time.date.toISOString()} className={timeSlot()}>
        {time.label}
      </time>
    </div>
  );
};
