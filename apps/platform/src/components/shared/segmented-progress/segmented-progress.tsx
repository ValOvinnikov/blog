import { Progress } from '@base-ui/react/progress';
import type { IWithClassName } from '@blog/config/types';

import { segmentedProgressVariants } from './segmented-progress-variants';

export type TSegmentedProgressProps = IWithClassName & {
  value: number;
  total: number;
  label: string;
};

export const SegmentedProgress = ({
  value,
  total,
  label,
  className,
}: TSegmentedProgressProps) => {
  const { root, label: labelSlot, track } = segmentedProgressVariants();

  return (
    <Progress.Root
      value={value}
      max={total}
      getAriaValueText={() => label}
      className={root({ class: className })}
    >
      <Progress.Label className={labelSlot()}>{label}</Progress.Label>
      <Progress.Track className={track()}>
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            data-testid="segmented-progress-segment"
            data-filled={index < value}
            className={segmentedProgressVariants({
              isFilled: index < value,
            }).segment()}
          />
        ))}
      </Progress.Track>
    </Progress.Root>
  );
};
