import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { headerBrandVariants } from './header-brand-variants';

export type THeaderBrandProps = IWithClassName &
  IWithDataTestId & {
    children?: ReactNode;
  };

/**
 * HeaderBrand — the brand/logo slot in the site `Header`; a styled `<span>` you
 * place the logo or wordmark in.
 */
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
