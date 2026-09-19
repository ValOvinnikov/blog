import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import {
  contentModuleVariants,
  type TContentModuleVariants,
} from './content-module-variants';

export type TContentModuleProps = IWithClassName &
  IWithDataTestId & {
    children: ReactNode;
    isWrapped?: TContentModuleVariants['wrapped'];
  };

/** Page-builder organism rendering a portable-text content block. */
export const ContentModule = ({
  children,
  className,
  dataTestId,
  isWrapped,
}: TContentModuleProps) => {
  const s = contentModuleVariants({ wrapped: isWrapped });

  return (
    <div className={s.root({ class: className })} data-testid={dataTestId}>
      <div className={s.body()}>{children}</div>
    </div>
  );
};
