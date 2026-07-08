import { type HTMLAttributes } from 'react';

import { captionVariants } from './caption-variants';

export type TCaptionProps = HTMLAttributes<HTMLElement>;

export const Caption = ({ className, children, ...rest }: TCaptionProps) => {
  return (
    <figcaption className={captionVariants({ class: className })} {...rest}>
      {children}
    </figcaption>
  );
};
