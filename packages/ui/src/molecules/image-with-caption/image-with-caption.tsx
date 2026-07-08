import type { IWithDataTestId } from '@blog/config';
import { Caption } from '@blog/ui/atoms/caption';
import { MediaFrame } from '@blog/ui/atoms/media-frame';
import type { ReactNode } from 'react';

import { imageWithCaptionVariants } from './image-with-caption-variants';

export interface IImageWithCaptionProps extends IWithDataTestId {
  caption?: string;
  className?: string;
  children?: ReactNode;
}

const s = imageWithCaptionVariants();

/**
 * Composes `MediaFrame` + `Caption` inside a `<figure>`. Pass the image
 * (e.g. a Next.js `<Image fill />`) as `children` and an optional `className`
 * to control the frame's aspect ratio or sizing.
 */
export const ImageWithCaption = ({
  caption,
  className,
  children,
  dataTestId,
}: IImageWithCaptionProps) => {
  return (
    <figure className={s.figure()} data-testid={dataTestId}>
      <MediaFrame className={className}>{children}</MediaFrame>
      {caption && <Caption>{caption}</Caption>}
    </figure>
  );
};
