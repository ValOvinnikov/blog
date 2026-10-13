import { cardListVariants } from '@platform/components/shared/card-list/card-list-variants';

export type TCardListTimeProps = {
  date: Date;
  children: string;
};

export const CardListTime = ({ date, children }: TCardListTimeProps) => {
  const { time } = cardListVariants();

  return (
    <time dateTime={date.toISOString()} className={time()}>
      {children}
    </time>
  );
};
