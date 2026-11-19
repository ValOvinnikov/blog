import type { IWithClassName } from '@shinefold/config';
import type { IWithChildren } from '@shinefold/config/react';

import { specimenVariants } from './specimen-variants';

export type TSpecimenListProps = IWithClassName & IWithChildren;

export const SpecimenList = ({ className, children }: TSpecimenListProps) => (
  <div className={specimenVariants().list({ class: className })}>
    {children}
  </div>
);
