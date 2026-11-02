'use client';

import { Toggle } from '@base-ui/react/toggle';
import type { TRegisteredIconName } from '@platform/components/shared/icon';
import { IconSoloControl } from '@platform/components/shared/icon-solo-control';

export type TIconSoloToggleProps = {
  ariaLabel: string;
  tooltip: string;
  icon: TRegisteredIconName;
  isPressed: boolean;
  onPressedChange: (isPressed: boolean) => void;
  isTooltipEndAligned?: boolean;
  className?: string;
};

export const IconSoloToggle = ({
  isPressed,
  onPressedChange,
  ...control
}: TIconSoloToggleProps) => (
  <IconSoloControl
    {...control}
    control={<Toggle pressed={isPressed} onPressedChange={onPressedChange} />}
  />
);
