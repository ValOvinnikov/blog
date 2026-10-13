import { cardListVariants } from '@platform/components/shared/card-list/card-list-variants';

export type TCardListPrimaryProps = {
  children: string;
};

export const CardListPrimary = ({ children }: TCardListPrimaryProps) => {
  const { primary } = cardListVariants();

  return <span className={primary()}>{children}</span>;
};
