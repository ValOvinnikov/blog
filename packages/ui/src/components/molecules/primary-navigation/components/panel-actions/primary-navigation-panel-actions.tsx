import type { ReactNode } from 'react';

export type TPrimaryNavigationPanelActionsProps = {
  children?: ReactNode;
};

/** Controls that sit in the bar on wide screens and move into the open phone menu as a row, such as the language and theme controls. */
export const PrimaryNavigationPanelActions = ({
  children,
}: TPrimaryNavigationPanelActionsProps) => children;
