import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { footerAboutVariants } from './footer-about-variants';

export type TFooterAboutProps = IWithClassName &
  IWithDataTestId & {
    children?: ReactNode;
  };

/** A short text about the site in the footer's brand column. */
export const FooterAbout = ({
  className,
  dataTestId,
  children,
}: TFooterAboutProps) => {
  if (!children) {
    return null;
  }
  return (
    <div
      className={footerAboutVariants({ class: className })}
      data-testid={dataTestId}
    >
      {children}
    </div>
  );
};
