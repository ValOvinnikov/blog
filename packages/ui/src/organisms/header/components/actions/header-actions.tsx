import type { ComponentPropsWithoutRef } from 'react';

import { headerActionsVariants } from './header-actions-variants';

export const HeaderActions = ({
  className,
  ...rest
}: ComponentPropsWithoutRef<'div'>) => (
  <div className={headerActionsVariants({ class: className })} {...rest} />
);
