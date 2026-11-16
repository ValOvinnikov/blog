import type { IWithClassName, IWithDataTestId } from '@shinefold/config';
import { Caption } from '@shinefold/ui/components/atoms/caption';
import { MediaFrame } from '@shinefold/ui/components/atoms/media-frame';
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
      {caption && <Caption>{caption}</Caption>}
    </figure>
  );
};
