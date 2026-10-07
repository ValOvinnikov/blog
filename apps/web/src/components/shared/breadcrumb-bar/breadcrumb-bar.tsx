import type { ReactNode } from 'react';

import { breadcrumbBarVariants } from './breadcrumb-bar-variants';

type TBreadcrumbBarProps = {
  children: ReactNode;
  isAbovePageHeading?: boolean;
};

export const BreadcrumbBar = ({
  children,
  isAbovePageHeading,
}: TBreadcrumbBarProps) => {
  const { root, inner } = breadcrumbBarVariants({ isAbovePageHeading });

  return (
    <div className={root()}>
      <div className={inner()}>{children}</div>
    </div>
  );
};
