import { type HTMLAttributes } from 'react';
import { type VariantProps } from 'tailwind-variants';

import { mediaFrameVariants } from './media-frame-variants';

export type TMediaFrameProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof mediaFrameVariants>;

/**
 * Positioning context for a Next.js `<Image fill />` child.
 * Use the `ratio` prop for common presets, or pass an arbitrary aspect-ratio
 * class via `className` for one-off sizes.
 *
 * @example
 * <MediaFrame ratio="video">
 *   <Image src={src} alt={alt} fill sizes="..." />
 * </MediaFrame>
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
