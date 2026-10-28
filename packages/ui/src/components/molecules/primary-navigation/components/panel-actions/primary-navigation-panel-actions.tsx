import type { ReactNode } from 'react';

export type TPrimaryNavigationPanelActionsProps = {
  children?: ReactNode;
};

/** Controls shown in the bar from `lg` up and as a row in the open phone panel below it. */
export const PrimaryNavigationPanelActions = ({
  children,
}: TPrimaryNavigationPanelActionsProps) => <>{children}</>;
