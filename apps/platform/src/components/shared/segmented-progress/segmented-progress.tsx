import { Progress } from '@base-ui/react/progress';
import type { IWithClassName } from '@blog/config/types';
import { toStepProgressState } from '@platform/utils/step-progress-state/step-progress-state';

import { segmentedProgressVariants } from './segmented-progress-variants';

type TSegmentedProgressProps = IWithClassName & {
  value: number;
  total: number;
  ariaLabel: string;
  valueText: string;
  isOnDark?: boolean;
};

export const SegmentedProgress = ({
  value,
  total,
  ariaLabel,
  valueText,
  isOnDark,
  className,
}: TSegmentedProgressProps) => {
  const { root, label, track } = segmentedProgressVariants({ isOnDark });

  return (
    <Progress.Root
      value={value}
      max={total}
      aria-label={ariaLabel}
      getAriaValueText={() => valueText}
      className={root({ class: className })}
    >
      <span aria-hidden="true" className={label()}>
        {valueText}
      </span>
      <Progress.Track aria-hidden="true" className={track()}>
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
