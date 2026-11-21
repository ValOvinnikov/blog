import type { IWithChildren } from '@shinefold/config/react';

import { subheadingVariants } from './subheading-variants';

export type TSubheadingProps = IWithChildren & {
  id?: string;
};

export const Subheading = ({ id, children }: TSubheadingProps) => (
  <p id={id} className={subheadingVariants()}>
    {children}
  </p>
);
