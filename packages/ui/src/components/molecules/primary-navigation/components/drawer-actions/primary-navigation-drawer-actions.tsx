import type { ReactNode } from 'react';

export type TPrimaryNavigationDrawerActionsProps = {
  children?: ReactNode;
};

/** Controls that exist only in the open phone panel, after the panel actions row. */
export const PrimaryNavigationDrawerActions = ({
  children,
}: TPrimaryNavigationDrawerActionsProps) => <>{children}</>;
