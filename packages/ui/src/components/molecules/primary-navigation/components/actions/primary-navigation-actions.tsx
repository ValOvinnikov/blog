import type { ReactNode } from 'react';

export type TPrimaryNavigationActionsProps = {
  children?: ReactNode;
};

/** The trailing controls that stay in the navigation bar at every width. */
export const PrimaryNavigationActions = ({
  children,
}: TPrimaryNavigationActionsProps) => <>{children}</>;
