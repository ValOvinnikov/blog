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
    /**
     * `wide` and `square` fill the card edge to edge; `circle` and `icon`
     * are inset tiles sized to their content instead.
     */
    shape?: TMediaCardMediaVariants['shape'];
    /**
     * Set by `MediaCard` when the card is center-aligned — centres an inset
     * `circle`/`icon` frame instead of hugging the card's left edge.
     */
    align?: TMediaCardMediaVariants['align'];
    children?: ReactNode;
  };

/**
 * MediaCardMedia — the media region of a `MediaCard`; a styled `<div>` wrapper
 * you fill with an image or `MediaFrame`.
 */
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
