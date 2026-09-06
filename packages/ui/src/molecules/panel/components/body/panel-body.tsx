import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { panelBodyVariants } from './panel-body-variants';

export type TPanelBodyProps = IWithClassName &
  IWithDataTestId & {
    children?: ReactNode;
  };

/**
 * Panel.Body — the padded content slot below a `Panel.Header`. Generic
 * positioning container; the caller supplies whatever feature-specific
 * content (a sign-in provider list, a rating gauge, a comment thread)
 * belongs inside the panel.
 */
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
