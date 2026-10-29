import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { footerLogoVariants } from './footer-logo-variants';

export type TFooterLogoProps = IWithClassName &
  IWithDataTestId & {
    children?: ReactNode;
  };

/** The site's logo at the top of the footer's brand column. */
export const FooterLogo = ({
  className,
  dataTestId,
  children,
}: TFooterLogoProps) => {
  if (!children) {
    return null;
  }
  return (
    <div
      className={footerLogoVariants({ class: className })}
      data-testid={dataTestId}
    >
      {children}
    </div>
  );
};
