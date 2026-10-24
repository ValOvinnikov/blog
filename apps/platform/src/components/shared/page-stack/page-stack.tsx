import type { IWithClassName } from '@blog/config/types';
import type { ReactNode } from 'react';

import { pageStackVariants } from './page-stack-variants';

export type TPageStackProps = IWithClassName & {
  children: ReactNode;
};

export const PageStack = ({ children, className }: TPageStackProps) => {
  const { root } = pageStackVariants();

  return <div className={root({ class: className })}>{children}</div>;
};
