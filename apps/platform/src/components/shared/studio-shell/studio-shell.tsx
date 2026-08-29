import type { ReactNode } from 'react';

import { studioShellVariants } from './studio-shell-variants';

export type TStudioShellProps = {
  children: ReactNode;
  className?: string;
};

/**
 * The bare, full-bleed container both Studio routes render into — no
 * `AdminShell` sidebar/topbar, since the embedded Studio is a self-contained
 * editing surface with its own navigation.
 */
export const StudioShell = ({ children, className }: TStudioShellProps) => {
  const { root } = studioShellVariants();

  return <div className={root({ class: className })}>{children}</div>;
};
