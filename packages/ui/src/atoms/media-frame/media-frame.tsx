import { type HTMLAttributes } from 'react';

import {
  mediaFrameVariants,
  type TMediaFrameVariants,
} from './media-frame-variants';

export type TMediaFrameProps = HTMLAttributes<HTMLDivElement> &
  TMediaFrameVariants;

/**
 * Positioning context for a Next.js `<Image fill />` child.
 * Use the `ratio` prop for common presets, or pass an arbitrary aspect-ratio
 * class via `className` for one-off sizes.
 */
export const MediaFrame = ({
  ratio,
  className,
  children,
  ...rest
}: TMediaFrameProps) => {
  return (
    <div className={mediaFrameVariants({ ratio, class: className })} {...rest}>
      {children}
    </div>
  );
};
