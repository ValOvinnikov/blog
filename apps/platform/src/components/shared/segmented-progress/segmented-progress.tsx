import { Progress } from '@base-ui/react/progress';
import type { IWithClassName } from '@blog/config/types';
import { toStepProgressState } from '@platform/utils/step-progress-state/step-progress-state';

import { segmentedProgressVariants } from './segmented-progress-variants';

type TSegmentedProgressProps = IWithClassName & {
  value: number;
  total: number;
  label: string;
  isOnDark?: boolean;
};

export const SegmentedProgress = ({
  value,
  total,
  label,
  isOnDark,
  className,
}: TSegmentedProgressProps) => {
  const {
    root,
    label: labelSlot,
    track,
  } = segmentedProgressVariants({
    isOnDark,
  });

  return (
    <Progress.Root
      value={value}
      max={total}
      getAriaValueText={() => label}
      className={root({ class: className })}
    >
      <Progress.Label className={labelSlot()}>{label}</Progress.Label>
      <Progress.Track className={track()}>
        {Array.from({ length: total }, (_, index) => {
          const state = toStepProgressState(index + 1, value);

          return (
            <span
              key={index}
              data-testid="segmented-progress-segment"
              data-state={state}
              className={segmentedProgressVariants({
                isOnDark,
                state,
              }).segment()}
            />
          );
        })}
      </Progress.Track>
    </Progress.Root>
  );
};
