import type { IWithDataTestId } from '@blog/config';
import { Caption } from '@blog/ui/atoms/caption';
import { MediaFrame } from '@blog/ui/atoms/media-frame';
import type { ReactNode } from 'react';

import {
  imageWithCaptionVariants,
  type TImageWithCaptionVariants,
} from './image-with-caption-variants';

export interface IImageWithCaptionProps extends IWithDataTestId {
  caption?: string;
  /** Editorial width/wrap treatment for the figure — defaults to `INLINE`. */
  layout?: TImageWithCaptionVariants['layout'];
  className?: string;
  children?: ReactNode;
}

/**
 * Composes `MediaFrame` + `Caption` inside a `<figure>`. Pass the image
 * (e.g. a Next.js `<Image fill />`) as `children` and an optional `className`
 * to control the frame's aspect ratio or sizing. The `layout` prop controls
 * the figure's own width and text-wrap behaviour — full-bleed, or floated to
 * one side for surrounding text to wrap around.
 */
export const ImageWithCaption = ({
  caption,
  layout,
  className,
  children,
  dataTestId,
}: IImageWithCaptionProps) => {
  const s = imageWithCaptionVariants({ layout });

  return (
    <figure className={s.figure()} data-testid={dataTestId}>
      <MediaFrame className={className}>{children}</MediaFrame>
      {caption && <Caption>{caption}</Caption>}
    </figure>
  );
};
