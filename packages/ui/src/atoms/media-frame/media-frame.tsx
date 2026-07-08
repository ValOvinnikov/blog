import { type HTMLAttributes } from 'react';

import { mediaFrameVariants } from './media-frame-variants';

export type TMediaFrameProps = HTMLAttributes<HTMLDivElement>;

/**
 * Positioning context for a Next.js `<Image fill />` child.
 * Always pass an aspect-ratio class (e.g. `className="aspect-video"`) to
 * control the rendered size.
 *
 * @example
 * <MediaFrame className="aspect-video">
 *   <Image src={src} alt={alt} fill sizes="..." />
 * </MediaFrame>
 */
export const MediaFrame = ({
  className,
  children,
  ...rest
}: TMediaFrameProps) => {
  return (
    <div className={mediaFrameVariants({ class: className })} {...rest}>
      {children}
    </div>
  );
};
