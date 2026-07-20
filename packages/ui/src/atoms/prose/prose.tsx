import type { IWithDataTestId } from '@blog/config';
import type { HTMLAttributes } from 'react';

import { proseVariants, type TProseVariants } from './prose-variants';

export interface IProseProps
  extends HTMLAttributes<HTMLDivElement>, IWithDataTestId {
  size?: TProseVariants['size'];
}

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
  ...rest
}: IProseProps) => (
  <div
    className={proseVariants({ size, class: className })}
    data-testid={dataTestId}
    {...rest}
  />
);
