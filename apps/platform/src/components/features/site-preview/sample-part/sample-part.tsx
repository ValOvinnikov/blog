import type { IWithChildren } from '@blog/config/react';
import type { IWithClassName } from '@blog/config/types';
import type { TSamplePart } from '@platform/constants/sample-part';

import { samplePartVariants } from './sample-part-variants';

export type TSamplePartProps = IWithChildren &
  IWithClassName & {
    part: TSamplePart;
  };

export const SamplePart = ({ part, className, children }: TSamplePartProps) => (
  <div data-part={part} className={samplePartVariants({ class: className })}>
    {children}
  </div>
);
