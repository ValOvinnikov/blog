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
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { ICON_SIZE, ICON_STROKE_WIDTH } from '@platform/constants/icon';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

const iconToggleGroupOptionVariants = tv({
  base: [
    'inline-flex size-11 cursor-pointer items-center justify-center lg:size-8 pointer-coarse:size-11',
    'rounded-admin-3 border-0 bg-transparent text-admin-muted',
    'hover:bg-admin-hover hover:text-admin-text',
    'data-[pressed]:bg-admin-surface data-[pressed]:text-admin-brand-strong',
    'data-[pressed]:hover:bg-admin-surface data-[pressed]:hover:text-admin-brand-strong',
    'data-[pressed]:not-focus-visible:shadow-[inset_0_0_0_1.5px_var(--admin-brand-ink)]',
    focusRingClasses(FOCUS_RING_GROUND.THEME_TRACK),
  ],
});

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
