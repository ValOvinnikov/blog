import {
  A_AS_CONST,
  type IWithClassName,
  type IWithDataTestId,
} from '@shinefold/config';
import type { TAnchorElementType } from '@shinefold/config/react';
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
  const { root, chip } = eyebrowVariants({ hasHref: Boolean(href) });
  const rootClassName = root({ class: className });
  const content = <span className={chip()}>{children}</span>;

  if (!href) {
    return (
      <p className={rootClassName} data-testid={dataTestId}>
        {content}
      </p>
    );
  }

  const Component = linkAs ?? A_AS_CONST;

  return (
    <Component className={rootClassName} data-testid={dataTestId} href={href}>
      {content}
    </Component>
  );
};
