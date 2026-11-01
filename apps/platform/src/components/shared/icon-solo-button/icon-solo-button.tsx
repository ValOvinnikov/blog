'use client';

import { Button } from '@base-ui/react/button';
import type { TRegisteredIconName } from '@platform/components/shared/icon';
import { IconSoloControl } from '@platform/components/shared/icon-solo-control';

export type TIconSoloButtonProps = {
  ariaLabel: string;
  tooltip: string;
  icon: TRegisteredIconName;
  onClick: () => void;
  isTooltipEndAligned?: boolean;
  className?: string;
};

export const IconSoloButton = ({
  onClick,
  ...control
}: TIconSoloButtonProps) => (
  <IconSoloControl {...control} control={<Button onClick={onClick} />} />
);
