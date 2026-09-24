import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import {
  mediaCardMediaVariants,
  type TMediaCardMediaVariants,
} from './media-card-media-variants';

export type TMediaCardMediaProps = IWithClassName &
  IWithDataTestId & {
    isLead?: TMediaCardMediaVariants['isLead'];
    shape?: TMediaCardMediaVariants['shape'];
    align?: TMediaCardMediaVariants['align'];
    children?: ReactNode;
  };

/** The media region of a `MediaCard`; a styled `<div>` wrapper you fill with an image or `MediaFrame`. */
export const MediaCardMedia = ({
  isLead,
  shape,
  align,
  className,
  dataTestId,
  children,
}: TMediaCardMediaProps) => (
  <div
    className={mediaCardMediaVariants({
      isLead,
      shape,
      align,
      class: className,
    })}
    data-testid={dataTestId}
  >
    {children}
  </div>
);
