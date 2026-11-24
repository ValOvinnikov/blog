import type { IWithClassName, IWithDataTestId } from '@shinefold/config';
import type { ReactNode } from 'react';

import { headerBrandVariants } from './header-brand-variants';

export type THeaderBrandProps = IWithClassName &
  IWithDataTestId & {
    children?: ReactNode;
  };

/** Holds the site's logo or wordmark at the leading end of the header. */
export const HeaderBrand = ({
  className,
  dataTestId,
  children,
}: THeaderBrandProps) => (
  <span
    className={headerBrandVariants({ class: className })}
    data-testid={dataTestId}
  >
    {children}
  </span>
);
