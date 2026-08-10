import type { IWithDataTestId } from '@blog/config';
import type { ComponentPropsWithoutRef } from 'react';

import { headerBrandVariants } from './header-brand-variants';

interface IHeaderBrandProps
  extends ComponentPropsWithoutRef<'span'>, IWithDataTestId {}

/**
 * HeaderBrand — the brand/logo slot in the site `Header`; a styled `<span>` you
 * place the logo or wordmark in.
 */
export const HeaderBrand = ({
  className,
  dataTestId,
  ...rest
}: IHeaderBrandProps) => (
  <span
    className={headerBrandVariants({ class: className })}
    data-testid={dataTestId}
    {...rest}
  />
);
