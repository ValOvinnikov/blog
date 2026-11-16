import type { IWithClassName, IWithDataTestId } from '@shinefold/config';
import { headingTags, type THeadingLevel } from '@shinefold/ui/lib/react';
import type { ReactNode } from 'react';

import { panelHeaderVariants } from './panel-header-variants';

export type TPanelHeaderProps = IWithClassName &
  IWithDataTestId & {
    headingLevel: THeadingLevel;
    children: ReactNode;
  };

/** The panel's title bar, rendered as a real heading so the panel's name takes its place in the page's heading outline. */
export const PanelHeader = ({
  className,
  dataTestId,
  headingLevel,
  children,
}: TPanelHeaderProps) => {
  const Tag = headingTags[headingLevel];
  return (
    <Tag
      className={panelHeaderVariants({ class: className })}
      data-testid={dataTestId}
    >
      {children}
    </Tag>
  );
};
