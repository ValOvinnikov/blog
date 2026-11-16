'use client';

import { Button } from '@base-ui/react/button';
import { Toolbar } from '@base-ui/react/toolbar';
import {
  Icon,
  type TRegisteredIconName,
} from '@platform/components/shared/icon';
import { useToolbarTabStop } from '@platform/components/shared/toolbar-tab-stop';
import { Tooltip } from '@platform/components/shared/tooltip';
import { ICON_SIZE, ICON_STROKE_WIDTH } from '@platform/constants/icon';
import type { IWithClassName } from '@shinefold/config/types';
import type { ReactElement } from 'react';

import { iconSoloControlVariants } from './icon-solo-control-variants';

type TIconSoloControlProps = {
  control: ReactElement;
  ariaLabel: string;
  tooltip: string;
  icon: TRegisteredIconName;
  isTooltipEndAligned?: boolean;
} & IWithClassName;

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
