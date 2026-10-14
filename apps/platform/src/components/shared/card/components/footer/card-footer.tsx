import { cardVariants } from '@platform/components/shared/card/card-variants';
import type { ReactNode } from 'react';

export type TCardFooterProps = {
  children: ReactNode;
  className?: string;
};

export const CardFooter = ({ children, className }: TCardFooterProps) => {
  const { footer } = cardVariants();

  return <div className={footer({ class: className })}>{children}</div>;
};
