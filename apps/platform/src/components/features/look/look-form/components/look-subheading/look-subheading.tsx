import type { IWithChildren } from '@blog/config/react';

import { lookSubheadingVariants } from './look-subheading-variants';

export type TLookSubheadingProps = IWithChildren & {
  id?: string;
};

export const LookSubheading = ({ id, children }: TLookSubheadingProps) => (
  <p id={id} className={lookSubheadingVariants()}>
    {children}
  </p>
);
