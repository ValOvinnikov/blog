import type { ComponentPropsWithoutRef } from 'react';

import { headerBrandVariants } from './header-brand-variants';

/**
 * HeaderBrand — the brand/logo slot in the site `Header`; a styled `<span>` you
 * place the logo or wordmark in.
 */
export const HeaderBrand = ({
  className,
  ...rest
}: ComponentPropsWithoutRef<'span'>) => (
  <span className={headerBrandVariants({ class: className })} {...rest} />
);
