import type { ComponentPropsWithoutRef } from 'react';

import { headerBrandVariants } from './header-brand-variants';

export const HeaderBrand = ({
  className,
  ...rest
}: ComponentPropsWithoutRef<'span'>) => (
  <span className={headerBrandVariants({ class: className })} {...rest} />
);
