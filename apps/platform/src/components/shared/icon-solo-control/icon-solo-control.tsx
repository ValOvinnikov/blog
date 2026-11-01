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
import { ICON_SIZE } from '@platform/constants/icon';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';
import type { ReactElement } from 'react';

const iconSoloControlVariants = tv({
  base: [
    'inline-flex size-11 flex-none cursor-pointer items-center justify-center lg:size-8.5 pointer-coarse:size-11',
    'rounded-admin-5 border border-admin-control-line bg-admin-surface text-admin-text',
    'hover:bg-admin-hover',
    'data-[pressed]:border-admin-brand-ink data-[pressed]:bg-admin-brand-weak data-[pressed]:text-admin-brand-strong',
    'data-[pressed]:hover:bg-admin-brand-weak',
    'data-[pressed]:not-focus-visible:shadow-[inset_0_0_0_1px_var(--admin-brand-ink)]',
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
          <Icon name={icon} size={ICON_SIZE.MD} strokeWidth={1.8} />
        </Trigger>
      }
    />
  );
};
