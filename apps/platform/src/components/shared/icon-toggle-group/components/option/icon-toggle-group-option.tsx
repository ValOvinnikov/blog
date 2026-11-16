'use client';

import { Toggle } from '@base-ui/react/toggle';
import {
  Icon,
  type TRegisteredIconName,
} from '@platform/components/shared/icon';
import {
  getToolbarStopId,
  useToolbarTabStop,
} from '@platform/components/shared/toolbar-tab-stop';
import { Tooltip } from '@platform/components/shared/tooltip';
import { ICON_SIZE, ICON_STROKE_WIDTH } from '@platform/constants/icon';

import { iconToggleGroupOptionVariants } from './icon-toggle-group-option-variants';

export type TIconToggleGroupOption<TValue extends string> = {
  value: TValue;
  icon: TRegisteredIconName;
  ariaLabel: string;
  tooltip: string;
  isTooltipEndAligned?: boolean;
};

type TIconToggleGroupOptionProps<TValue extends string> = {
  option: TIconToggleGroupOption<TValue>;
  groupLabel: string;
};

export const IconToggleGroupOption = <TValue extends string>({
  option: { value, icon, ariaLabel, tooltip, isTooltipEndAligned },
  groupLabel,
}: TIconToggleGroupOptionProps<TValue>) => {
  const stop = useToolbarTabStop(getToolbarStopId(groupLabel, value));

  return (
    <Tooltip
      label={tooltip}
      align={isTooltipEndAligned ? 'end' : undefined}
      trigger={
        <Toggle
          value={value}
          aria-label={ariaLabel}
          className={iconToggleGroupOptionVariants()}
          {...stop}
        >
          <Icon
            name={icon}
            size={ICON_SIZE.MD}
            strokeWidth={ICON_STROKE_WIDTH.CONTROL}
          />
        </Toggle>
      }
    />
  );
};
