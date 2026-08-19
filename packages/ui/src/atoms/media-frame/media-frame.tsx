import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import {
  mediaFrameVariants,
  type TMediaFrameVariants,
} from './media-frame-variants';

export type TMediaFrameProps = IWithClassName &
  TMediaFrameVariants &
  IWithDataTestId & {
    children?: ReactNode;
  };

/**
 * Positioning context for a Next.js `<Image fill />` child.
 * Use the `ratio` prop for common presets, or pass an arbitrary aspect-ratio
 * class via `className` for one-off sizes.
 */
export const MediaFrame = ({
  ratio,
  className,
  children,
  dataTestId,
}: TMediaFrameProps) => {
  return (
    <div
      className={mediaFrameVariants({ ratio, class: className })}
      data-testid={dataTestId}
    >
      {children}
    </div>
  );
};
