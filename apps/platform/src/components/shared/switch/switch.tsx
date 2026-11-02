'use client';

import { Switch as BaseSwitch } from '@base-ui/react/switch';
import type { TNamedControlAria } from '@blog/config';

import { switchVariants } from './switch-variants';

type TSwitchLabels = { on: string; off: string } | { caption: string };

export type TSwitchProps = {
  isChecked: boolean;
  onCheckedChange: (checked: boolean) => void;
  aria: TNamedControlAria;
  labels: TSwitchLabels;
  isDisabled?: boolean;
  isLocked?: boolean;
};

export const Switch = ({
  isChecked,
  onCheckedChange,
  aria,
  labels,
  isDisabled = false,
  isLocked = false,
}: TSwitchProps) => {
  const { label, labelledBy, describedBy } = aria;
  const { root, track, thumb, stateText, stateOption } = switchVariants({
    isLocked,
  });

  return (
    <label className={root()}>
      {/* A native button keeps `aria.label` as the name; a span would be renamed after the wrapping label. */}
      <BaseSwitch.Root
        checked={isChecked}
        onCheckedChange={(checked) => {
          if (!isLocked) onCheckedChange(checked);
        }}
        disabled={isDisabled}
        aria-label={label}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-disabled={isLocked || undefined}
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
