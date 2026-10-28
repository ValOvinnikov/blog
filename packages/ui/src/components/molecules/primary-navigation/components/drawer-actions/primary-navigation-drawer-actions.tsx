import type { ReactNode } from 'react';

export type TPrimaryNavigationDrawerActionsProps = {
  children?: ReactNode;
};

/** Controls that exist only in the open phone menu, below its other rows. */
export const PrimaryNavigationDrawerActions = ({
  children,
}: TPrimaryNavigationDrawerActionsProps) => children;
