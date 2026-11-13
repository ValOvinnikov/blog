'use client';

import { Button } from '@base-ui/react/button';
import { Toolbar } from '@base-ui/react/toolbar';
import {
  Icon,
  type TRegisteredIconName,
} from '@platform/components/shared/icon';
import { useToolbarTabStop } from '@platform/components/shared/toolbar-tab-stop';
import { Tooltip } from '@platform/components/shared/tooltip';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { ICON_SIZE, ICON_STROKE_WIDTH } from '@platform/constants/icon';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';
import type { ReactElement } from 'react';

const iconSoloControlVariants = tv({
  base: [
    // md:size-11 outranks the md:h-8 of the Button this control may render.
    'inline-flex size-11 flex-none cursor-pointer items-center justify-center md:size-11 lg:size-8.5 pointer-coarse:size-11',
    'rounded-platform-5 border border-platform-control-line bg-platform-surface text-platform-text',
    'hover:bg-platform-hover',
    'data-[pressed]:border-platform-brand-ink data-[pressed]:bg-platform-brand-weak data-[pressed]:text-platform-brand-strong',
    'data-[pressed]:hover:bg-platform-brand-weak',
    'data-[pressed]:not-focus-visible:shadow-[inset_0_0_0_1px_var(--platform-brand-ink)]',
    focusRingClasses(FOCUS_RING_GROUND.SURFACE),
  ],
});

type TIconSoloControlProps = {
  control: ReactElement;
  ariaLabel: string;
  tooltip: string;
  icon: TRegisteredIconName;
  isTooltipEndAligned?: boolean;
  className?: string;
};

export const IconSoloControl = ({
  control,
  ariaLabel,
  tooltip,
  icon,
  isTooltipEndAligned,
  className,
}: TIconSoloControlProps) => {
  const stop = useToolbarTabStop(ariaLabel);
  const Trigger = stop ? Toolbar.Button : Button;

  return (
    <Tooltip
      label={tooltip}
      align={isTooltipEndAligned ? 'end' : undefined}
      trigger={
        <Trigger
          render={control}
          aria-label={ariaLabel}
          className={iconSoloControlVariants({ class: className })}
          {...stop}
        >
          <Icon
            name={icon}
            size={ICON_SIZE.MD}
            strokeWidth={ICON_STROKE_WIDTH.CONTROL}
          />
        </Trigger>
      }
    />
  );
};
