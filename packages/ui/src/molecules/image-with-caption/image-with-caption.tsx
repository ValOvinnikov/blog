import type { IWithClassName, IWithDataTestId } from '@blog/config';
import { Caption } from '@blog/ui/atoms/caption';
import { MediaFrame } from '@blog/ui/atoms/media-frame';
import type { ReactNode } from 'react';

import {
  imageWithCaptionVariants,
  type TImageWithCaptionVariants,
} from './image-with-caption-variants';

export type TImageWithCaptionProps = IWithClassName &
  IWithDataTestId & {
    caption?: string;
    layout?: TImageWithCaptionVariants['layout'];
    children?: ReactNode;
  };

/** Composes `MediaFrame` + `Caption` inside a `<figure>`. */
export const ImageWithCaption = ({
  caption,
  layout,
  className,
  children,
  dataTestId,
}: TImageWithCaptionProps) => {
  const s = imageWithCaptionVariants({ layout });

  return (
    <figure className={s.figure()} data-testid={dataTestId}>
      <MediaFrame className={className}>{children}</MediaFrame>
      {caption && (
        <Caption dataTestId="image-with-caption-caption">{caption}</Caption>
      )}
    </figure>
  );
};
