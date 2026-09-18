import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import {
  mediaCardMediaVariants,
  type TMediaCardMediaVariants,
} from './media-card-media-variants';

export type TMediaCardMediaProps = IWithClassName &
  IWithDataTestId & {
    /** Set by `MediaCard` on lead cards — swaps the default 16:9 frame for a taller 4:3 one. */
    isLead?: TMediaCardMediaVariants['isLead'];
    children?: ReactNode;
  };

/**
 * MediaCardMedia — the media region of a `MediaCard`; a styled `<div>` wrapper
 * you fill with an image or `MediaFrame`.
 */
export const MediaCardMedia = ({
  isLead,
  className,
  dataTestId,
  children,
}: TMediaCardMediaProps) => (
  <div
    className={mediaCardMediaVariants({ isLead, class: className })}
    data-testid={dataTestId}
  >
    {children}
  </div>
);
