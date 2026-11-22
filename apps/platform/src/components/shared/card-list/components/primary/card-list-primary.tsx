import { cardListVariants } from '@platform/components/shared/card-list/card-list-variants';
import type { ReactNode } from 'react';

export type TCardListPrimaryProps = {
  children: ReactNode;
};

export const CardListPrimary = ({ children }: TCardListPrimaryProps) => {
  const { primary } = cardListVariants();

  return <span className={primary()}>{children}</span>;
};
