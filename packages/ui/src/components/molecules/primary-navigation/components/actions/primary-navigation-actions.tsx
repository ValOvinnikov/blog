import type { ReactNode } from 'react';

export type TPrimaryNavigationActionsProps = {
  children?: ReactNode;
};

/** Controls that stay in the bar at every width, such as the theme toggle or the account button. */
export const PrimaryNavigationActions = ({
  children,
}: TPrimaryNavigationActionsProps) => children;
