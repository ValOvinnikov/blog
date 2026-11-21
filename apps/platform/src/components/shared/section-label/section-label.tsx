import type { IWithChildren } from '@shinefold/config/react';

import { sectionLabelVariants } from './section-label-variants';

export type TSectionLabelProps = IWithChildren & {
  id: string;
};

export const SectionLabel = ({ id, children }: TSectionLabelProps) => (
  <p id={id} className={sectionLabelVariants()}>
    {children}
  </p>
);
