import {
  A_AS_CONST,
  type IWithClassName,
  type IWithDataTestId,
} from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { type ReactNode } from 'react';

import { eyebrowVariants } from './eyebrow-variants';

export type TEyebrowProps = IWithClassName &
  IWithDataTestId & {
    href?: string;
    linkAs?: TAnchorElementType;
    children?: ReactNode;
  };

/** Small uppercase label displayed above a heading to provide contextual topic or section context. */
export const Eyebrow = ({
  href,
  linkAs,
  className,
  dataTestId,
  children,
}: TEyebrowProps) => {
  const rootClassName = eyebrowVariants({
    hasHref: Boolean(href),
    class: className,
  });

  if (!href) {
    return (
      <p className={rootClassName} data-testid={dataTestId}>
        {children}
      </p>
    );
  }

  const Component = linkAs ?? A_AS_CONST;

  return (
    <Component className={rootClassName} data-testid={dataTestId} href={href}>
      {children}
    </Component>
  );
};
