import type { ReactNode } from 'react';

import { sampleChipVariants } from './sample-chip-variants';

export type TSampleChipProps = {
  children: ReactNode;
};

export const SampleChip = ({ children }: TSampleChipProps) => (
  <span className={sampleChipVariants()}>{children}</span>
);
