import type { IWithClassName, IWithDataTestId } from '@blog/config';

import { metaSeparatorVariants } from './meta-separator-variants';

export type TMetaSeparatorProps = IWithClassName &
  IWithDataTestId & {
    separator?: string;
  };

/** Decorative separator for inline metadata lists (e.g. "Author · Date · Read time"). */
export const MetaSeparator = ({
  separator = '·',
  className,
  dataTestId,
}: TMetaSeparatorProps) => {
  return (
    <span
      className={metaSeparatorVariants({ class: className })}
      aria-hidden="true"
      data-testid={dataTestId}
    >
      {separator}
    </span>
  );
};
