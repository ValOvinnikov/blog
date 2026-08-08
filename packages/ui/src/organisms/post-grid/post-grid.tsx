import type { IWithDataTestId } from '@blog/config';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { postGridVariants } from './post-grid-variants';

export interface IPostGridProps
  extends Pick<ComponentPropsWithoutRef<'div'>, 'className'>, IWithDataTestId {
  children: ReactNode;
}

/**
 * PostGrid — the responsive grid container that lays out `PostCard`s (or any
 * children) in columns. Layout only — no data or per-item chrome of its own.
 */
export const PostGrid = ({
  children,
  className,
  dataTestId,
}: IPostGridProps) => (
  <div
    className={postGridVariants({ class: className })}
    data-testid={dataTestId}
  >
    {children}
  </div>
);
