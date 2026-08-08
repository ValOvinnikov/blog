import type { ComponentPropsWithoutRef } from 'react';

import { footerCopyrightVariants } from './footer-copyright-variants';

interface IFooterCopyrightProps extends Omit<
  ComponentPropsWithoutRef<'span'>,
  'children'
> {
  title: string;
}

/**
 * FooterCopyright — the copyright line in the site `Footer`; renders
 * "© {year} {title}" with the current year filled in automatically.
 */
export const FooterCopyright = ({
  title,
  className,
  ...rest
}: IFooterCopyrightProps) => (
  <span className={footerCopyrightVariants({ class: className })} {...rest}>
    &copy; {new Date().getFullYear()} {title}
  </span>
);
