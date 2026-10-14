import { cardVariants } from '@platform/components/shared/card/card-variants';
import type { ReactNode } from 'react';

export type TCardBodyProps = {
  children: ReactNode;
  className?: string;
};

export const CardBody = ({ children, className }: TCardBodyProps) => {
  const { body } = cardVariants();

  return <div className={body({ class: className })}>{children}</div>;
};
