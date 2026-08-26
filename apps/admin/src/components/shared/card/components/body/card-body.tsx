import type { ReactNode } from 'react';

import { cardVariants } from '../../card-variants';

export type TCardBodyProps = {
  children: ReactNode;
  className?: string;
};

export const CardBody = ({ children, className }: TCardBodyProps) => {
  const { body } = cardVariants();

  return <div className={body({ class: className })}>{children}</div>;
};
