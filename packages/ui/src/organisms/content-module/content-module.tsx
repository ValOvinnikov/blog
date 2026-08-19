import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import {
  contentModuleVariants,
  type TContentModuleVariants,
} from './content-module-variants';

export type TContentModuleProps = IWithClassName &
  IWithDataTestId & {
    children: ReactNode;
    /**
     * Drops this component's own top margin. Set when a parent (e.g. `Section`)
     * already owns the vertical spacing around it, so the two don't stack.
     */
    wrapped?: TContentModuleVariants['wrapped'];
  };

/**
 * ContentModule — page-builder organism rendering a portable-text content
 * block. Renders no heading of its own — `body` is free-form rich text that
 * can carry its own headings, so a separate structured heading field would
 * just be a second way to do the same thing.
 */
export const ContentModule = ({
  children,
  className,
  dataTestId,
  wrapped,
}: TContentModuleProps) => {
  const s = contentModuleVariants({ wrapped });

  return (
    <div className={s.root({ class: className })} data-testid={dataTestId}>
      <div className={s.body()}>{children}</div>
    </div>
  );
};
