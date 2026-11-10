import type { IWithChildren } from '@blog/config/react';

import { lookSubheadingVariants } from './look-subheading-variants';

export const LookSubheading = ({ children }: IWithChildren) => (
  <p className={lookSubheadingVariants()}>{children}</p>
);
