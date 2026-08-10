import type { IWithDataTestId } from '@blog/config';
import { type HTMLAttributes } from 'react';

import { captionVariants } from './caption-variants';

export type TCaptionProps = HTMLAttributes<HTMLElement> & IWithDataTestId;

/**
 * Accessible caption for a media element. Renders as `<figcaption>` and should
 * be placed inside a `<figure>` alongside `MediaFrame`.
 */
export const Caption = ({
  className,
  children,
  dataTestId,
  ...rest
}: TCaptionProps) => {
  return (
    <figcaption
      className={captionVariants({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      {children}
    </figcaption>
  );
};
