import type { IWithDataTestId } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { type ElementType, type HTMLAttributes } from 'react';

import { eyebrowVariants } from './eyebrow-variants';

type TEyebrowOwnProps = {
  href?: string;
  linkAs?: TAnchorElementType;
} & IWithDataTestId;

export type TEyebrowProps = TEyebrowOwnProps &
  Omit<HTMLAttributes<HTMLElement>, keyof TEyebrowOwnProps>;

/**
 * Eyebrow atom — small uppercase label displayed above a heading to provide
 * contextual category or section context. Renders as a plain `<p>` by
 * default; pass `href` (and optionally `linkAs`, defaulting to `'a'`) to
 * render it as a link to the category route instead.
 */
export const Eyebrow = ({
  href,
  linkAs,
  className,
  dataTestId,
  children,
  ...rest
}: TEyebrowProps) => {
  const Component = (href ? (linkAs ?? 'a') : 'p') as ElementType;

  return (
    <Component
      className={eyebrowVariants({ hasHref: Boolean(href), class: className })}
      data-testid={dataTestId}
      href={href}
      {...rest}
    >
      {children}
    </Component>
  );
};
