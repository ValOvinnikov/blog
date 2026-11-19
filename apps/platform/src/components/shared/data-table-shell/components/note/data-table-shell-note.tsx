import { dataTableShellVariants } from '@platform/components/shared/data-table-shell/data-table-shell-variants';
import type { ReactNode } from 'react';

export type TDataTableShellNoteProps = {
  children: ReactNode;
};

export const DataTableShellNote = ({ children }: TDataTableShellNoteProps) => {
  const { note } = dataTableShellVariants();

  return <p className={note()}>{children}</p>;
};
