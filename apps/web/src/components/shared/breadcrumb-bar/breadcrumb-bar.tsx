import type { ReactNode } from 'react';

import { breadcrumbBarVariants } from './breadcrumb-bar-variants';

type TBreadcrumbBarProps = { children: ReactNode };

const { root, inner } = breadcrumbBarVariants();

export const BreadcrumbBar = ({ children }: TBreadcrumbBarProps) => (
  <div className={root()}>
    <div className={inner()}>{children}</div>
  </div>
);
