import {
  A_AS_CONST,
  type IWithClassName,
  type IWithDataTestId,
} from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import type { ReactNode } from 'react';

import { cardLinkVariants } from './card-link-variants';

export type TCardLinkProps = IWithClassName &
  IWithDataTestId & {
    href: string;
    linkAs?: TAnchorElementType;
    target?: '_blank';
    ariaLabel?: string;
    children: ReactNode;
  };

/** The one link that makes a whole item card its click target. */
export const CardLink = ({
  href,
  linkAs,
  target,
  ariaLabel,
  children,
  className,
  dataTestId,
}: TCardLinkProps) => {
  const LinkComponent = linkAs ?? A_AS_CONST;

  return (
    <LinkComponent
      href={href}
      target={target}
      aria-label={ariaLabel}
      className={cardLinkVariants({ class: className })}
      data-testid={dataTestId}
    >
      {children}
    </LinkComponent>
  );
};
