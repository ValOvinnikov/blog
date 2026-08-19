import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { proseVariants, type TProseVariants } from './prose-variants';

export type TProseProps = IWithClassName &
  IWithDataTestId & {
    size?: TProseVariants['size'];
    children?: ReactNode;
  };

/**
 * Typography wrapper for long-form body text. Applies consistent font,
 * color, line-height, and size to whatever rich-text markup a consumer
 * (e.g. a `PortableTextRenderer` in `apps/web`) renders as `children`.
 * Width-agnostic — the consuming app applies `max-w-measure` around it.
 */
export const Prose = ({
  size,
  className,
  dataTestId,
  children,
}: TProseProps) => (
  <div
    className={proseVariants({ size, class: className })}
    data-testid={dataTestId}
  >
    {children}
  </div>
);
