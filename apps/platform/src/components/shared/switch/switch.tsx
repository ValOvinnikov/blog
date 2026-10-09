'use client';

import { Switch as BaseSwitch } from '@base-ui/react/switch';
import type { AriaAttributes } from 'react';

import { switchVariants } from './switch-variants';

type TSwitchLabels = { on: string; off: string } | { caption: string };

export type TSwitchProps = {
  isChecked: boolean;
  onCheckedChange: (checked: boolean) => void;
  ariaLabel: string;
  labels: TSwitchLabels;
  isDisabled?: boolean;
  'aria-describedby'?: AriaAttributes['aria-describedby'];
};

export const Switch = ({
  isChecked,
  onCheckedChange,
  ariaLabel,
  labels,
  isDisabled = false,
  'aria-describedby': ariaDescribedBy,
}: TSwitchProps) => {
  const { root, track, thumb, stateText, stateOption } = switchVariants();

  return (
    <label className={root()}>
      {/* A native button keeps `ariaLabel` as the name; a span would be renamed after the wrapping label. */}
      <BaseSwitch.Root
        checked={isChecked}
        onCheckedChange={onCheckedChange}
        disabled={isDisabled}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        nativeButton={true}
        render={<button type="button" />}
        className={track()}
      >
        <BaseSwitch.Thumb className={thumb()} />
      </BaseSwitch.Root>
      {'caption' in labels ? (
        <span>{labels.caption}</span>
      ) : (
        <span className={stateText()}>
          <span className={stateOption({ isShown: isChecked })}>
            {labels.on}
          </span>
          <span className={stateOption({ isShown: !isChecked })}>
            {labels.off}
          </span>
        </span>
      )}
    </label>
  );
};
