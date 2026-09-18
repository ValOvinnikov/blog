import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { cardGridVariants, type TCardGridVariants } from './card-grid-variants';

export type TCardGridProps = IWithClassName &
  IWithDataTestId & {
    columns?: TCardGridVariants['columns'];
    children: ReactNode;
  };

/**
 * CardGrid — the responsive grid container that lays out cards (or any
 * children) in columns. Layout only — no data or per-item chrome of its own.
 */
export const CardGrid = ({
  columns,
  children,
  className,
  dataTestId,
}: TCardGridProps) => (
  <div
    className={cardGridVariants({ columns, class: className })}
    data-testid={dataTestId}
  >
    {children}
  </div>
);
