import {
  SAMPLE_PART_ATTRIBUTE,
  SAMPLE_PART_ITEMS_ATTRIBUTE,
  type TSamplePart,
} from '@platform/constants/sample-part';
import type { IWithChildren } from '@shinefold/config/react';
import type { IWithClassName } from '@shinefold/config/types';

import { samplePartVariants } from './sample-part-variants';

export type TSamplePartProps = IWithChildren &
  IWithClassName & {
    part: TSamplePart;
    isEachListItem?: boolean;
  };

export const SamplePart = ({
  part,
  isEachListItem = false,
  className,
  children,
}: TSamplePartProps) => (
  <div
    {...{
      [isEachListItem ? SAMPLE_PART_ITEMS_ATTRIBUTE : SAMPLE_PART_ATTRIBUTE]:
        part,
    }}
    className={samplePartVariants({ class: className })}
  >
    {children}
  </div>
);
