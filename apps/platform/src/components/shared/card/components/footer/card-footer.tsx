import type { ReactNode } from 'react';

import { cardVariants } from '../../card-variants';

export type TCardFooterProps = {
  children: ReactNode;
  className?: string;
};

export const CardFooter = ({ children, className }: TCardFooterProps) => {
  const { footer } = cardVariants();

  return <div className={footer({ class: className })}>{children}</div>;
};
