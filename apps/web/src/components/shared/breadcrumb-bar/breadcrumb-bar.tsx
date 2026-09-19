import type { ReactNode } from 'react';

import { breadcrumbBarVariants } from './breadcrumb-bar-variants';

type TBreadcrumbBarProps = {
  children: ReactNode;
};

export const BreadcrumbBar = ({ children }: TBreadcrumbBarProps) => {
  const { root, inner } = breadcrumbBarVariants();

  return (
    <div className={root()}>
      <div className={inner()}>{children}</div>
    </div>
  );
};
