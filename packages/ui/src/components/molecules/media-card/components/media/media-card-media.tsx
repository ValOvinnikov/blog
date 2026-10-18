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
    iconPanel?: TMediaCardMediaVariants['iconPanel'];
    children?: ReactNode;
  };

/** The media region of a `MediaCard`, reserving a consistent shape for its visual content regardless of what fills it. */
export const MediaCardMedia = ({
  isLead,
  shape,
  align,
  iconPanel,
  className,
  dataTestId,
  children,
}: TMediaCardMediaProps) => (
  <div
    className={mediaCardMediaVariants({
      isLead,
      shape,
      align,
      iconPanel,
      class: className,
    })}
    data-testid={dataTestId}
  >
    {children}
  </div>
);
