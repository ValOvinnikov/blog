import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { panelBodyVariants } from './panel-body-variants';

export type TPanelBodyProps = IWithClassName &
  IWithDataTestId & {
    children?: ReactNode;
  };

/** The padded content slot below a `Panel.Header`. */
export const PanelBody = ({
  className,
  dataTestId,
  children,
}: TPanelBodyProps) => (
  <div
    className={panelBodyVariants({ class: className })}
    data-testid={dataTestId}
  >
    {children}
  </div>
);
