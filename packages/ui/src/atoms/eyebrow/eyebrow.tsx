import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { resolveComponent } from '@blog/ui/lib/react';
import { type ReactNode } from 'react';

import { eyebrowVariants } from './eyebrow-variants';

export type TEyebrowProps = IWithClassName &
  IWithDataTestId & {
    href?: string;
    linkAs?: TAnchorElementType;
    children?: ReactNode;
  };

/**
 * Eyebrow atom — small uppercase label displayed above a heading to provide
 * contextual topic or section context. Renders as a plain `<p>` by
 * default; pass `href` (and optionally `linkAs`, defaulting to `'a'`) to
 * render it as a link to the topic route instead.
 */
export const Eyebrow = ({
  href,
  linkAs,
  className,
  dataTestId,
  children,
}: TEyebrowProps) => {
  const Component = href ? resolveComponent(linkAs, 'a') : 'p';

  return (
    // eslint-disable-next-line react-hooks/static-components -- resolveComponent returns `linkAs`/`fallback` verbatim, so the reference stays stable across renders
    <Component
      className={eyebrowVariants({ hasHref: Boolean(href), class: className })}
      data-testid={dataTestId}
      href={href}
    >
      {children}
    </Component>
  );
};
