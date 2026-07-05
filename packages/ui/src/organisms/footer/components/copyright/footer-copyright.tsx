import type { ComponentPropsWithoutRef } from 'react';

import { footerCopyrightVariants } from './footer-copyright-variants';

interface IFooterCopyrightProps extends Omit<
  ComponentPropsWithoutRef<'p'>,
  'children'
> {
  title: string;
}

export const FooterCopyright = ({
  title,
  className,
  ...rest
}: IFooterCopyrightProps) => (
  <p className={footerCopyrightVariants({ class: className })} {...rest}>
    &copy; {new Date().getFullYear()} {title}
  </p>
);
