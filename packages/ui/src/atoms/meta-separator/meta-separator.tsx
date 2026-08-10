import type { IWithDataTestId } from '@blog/config';
import { type HTMLAttributes } from 'react';

import { metaSeparatorVariants } from './meta-separator-variants';

export interface IMetaSeparatorProps
  extends HTMLAttributes<HTMLSpanElement>, IWithDataTestId {
  separator?: string;
}

/**
 * MetaSeparator atom — decorative separator for inline metadata lists
 * (e.g. "Author · Date · Read time"). Hidden from assistive technology.
 * Defaults to a middle dot but accepts any separator character via the
 * `separator` prop.
 */
export const MetaSeparator = ({
  separator = '·',
  className,
  dataTestId,
  ...rest
}: IMetaSeparatorProps) => {
  return (
    <span
      className={metaSeparatorVariants({ class: className })}
      aria-hidden="true"
      data-testid={dataTestId}
      {...rest}
    >
      {separator}
    </span>
  );
};
