import type { IWithClassName, IWithDataTestId } from '@blog/config';

import { footerWordmarkVariants } from './footer-wordmark-variants';

export type TFooterWordmarkProps = IWithClassName &
  IWithDataTestId & {
    children?: string;
  };

/** The site name set large as decoration in the Big wordmark layout, hidden from assistive technology because the copyright line already names the site. */
export const FooterWordmark = ({
  className,
  dataTestId,
  children,
}: TFooterWordmarkProps) => {
  if (!children) {
    return null;
  }
  return (
    <span
      aria-hidden={true}
      className={footerWordmarkVariants({ class: className })}
      data-testid={dataTestId}
    >
      {children}
    </span>
  );
};
