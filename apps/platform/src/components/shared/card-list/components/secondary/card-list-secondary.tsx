import { cardListVariants } from '@platform/components/shared/card-list/card-list-variants';

export type TCardListSecondaryProps = {
  children: string;
};

export const CardListSecondary = ({ children }: TCardListSecondaryProps) => {
  const { secondary } = cardListVariants();

  return <span className={secondary()}>{children}</span>;
};
