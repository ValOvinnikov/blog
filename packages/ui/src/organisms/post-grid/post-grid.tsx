import type { IWithDataTestId } from '@blog/config';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { postGridVariants } from './post-grid-variants';

export interface IPostGridProps
  extends Pick<ComponentPropsWithoutRef<'div'>, 'className'>, IWithDataTestId {
  children: ReactNode;
}

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
