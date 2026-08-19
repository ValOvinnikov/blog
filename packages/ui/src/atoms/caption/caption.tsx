import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { captionVariants } from './caption-variants';

export type TCaptionProps = IWithClassName &
  IWithDataTestId & {
    children?: ReactNode;
  };

/**
 * Accessible caption for a media element. Renders as `<figcaption>` and should
 * be placed inside a `<figure>` alongside `MediaFrame`.
 */
export const Caption = ({ className, children, dataTestId }: TCaptionProps) => {
  return (
    <figcaption
      className={captionVariants({ class: className })}
      data-testid={dataTestId}
    >
      {children}
    </figcaption>
  );
};
