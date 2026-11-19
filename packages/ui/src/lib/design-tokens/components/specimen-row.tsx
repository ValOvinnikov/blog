import type { IWithClassName } from '@shinefold/config';
import type { IWithChildren } from '@shinefold/config/react';

import { specimenVariants } from './specimen-variants';

export type TSpecimenRowProps = IWithClassName &
  IWithChildren & {
    label: string;
  };

export const SpecimenRow = ({
  label,
  className,
  children,
}: TSpecimenRowProps) => {
  const s = specimenVariants();

  return (
    <div className={s.row({ class: className })}>
      <p className={s.label()}>{label}</p>
      {children}
    </div>
  );
};
