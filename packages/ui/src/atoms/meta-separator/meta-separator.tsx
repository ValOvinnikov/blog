import { type HTMLAttributes } from 'react';

import { metaSeparatorVariants } from './meta-separator-variants';

export interface IMetaSeparatorProps extends HTMLAttributes<HTMLSpanElement> {
  separator?: string;
}

/**
 * MetaSeparator atom — decorative separator for inline metadata lists
 * (e.g. "Author · Date · Read time"). Hidden from assistive technology.
 * Defaults to a middle dot but accepts any separator character via the
 * `separator` prop.
 *
 * @example
 * <span>John Doe</span><MetaSeparator /><span>Jan 1, 2025</span>
 * <span>John Doe</span><MetaSeparator separator="/" /><span>Jan 1, 2025</span>
 */
export const MetaSeparator = ({
  separator = '·',
  className,
  ...rest
}: IMetaSeparatorProps) => {
  return (
    <span
      className={metaSeparatorVariants({ class: className })}
      aria-hidden="true"
      {...rest}
    >
      {separator}
    </span>
  );
};
