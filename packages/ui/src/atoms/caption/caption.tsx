import { type HTMLAttributes } from 'react';

import { captionVariants } from './caption-variants';

export type TCaptionProps = HTMLAttributes<HTMLElement>;

/**
 * Accessible caption for a media element. Renders as `<figcaption>` and should
 * be placed inside a `<figure>` alongside `MediaFrame`.
 */
export const Caption = ({ className, children, ...rest }: TCaptionProps) => {
  return (
    <figcaption className={captionVariants({ class: className })} {...rest}>
      {children}
    </figcaption>
  );
};
