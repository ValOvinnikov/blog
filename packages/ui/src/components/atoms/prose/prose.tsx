import type { IWithClassName, IWithDataTestId } from '@shinefold/config';
import type { ReactNode } from 'react';

import { proseVariants } from './prose-variants';

export type TProseProps = IWithClassName &
  IWithDataTestId & {
    children?: ReactNode;
  };

/** Typography wrapper for long-form body text. */
export const Prose = ({ className, dataTestId, children }: TProseProps) => (
  <div className={proseVariants({ class: className })} data-testid={dataTestId}>
    {children}
  </div>
);
