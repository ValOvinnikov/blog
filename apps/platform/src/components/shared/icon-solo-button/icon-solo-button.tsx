'use client';

import { Button } from '@base-ui/react/button';
import type { TRegisteredIconName } from '@platform/components/shared/icon';
import { IconSoloControl } from '@platform/components/shared/icon-solo-control';
import type { IWithClassName } from '@shinefold/config/types';
import type { Ref } from 'react';

export type TIconSoloButtonProps = IWithClassName & {
  ariaLabel: string;
  tooltip: string;
  icon: TRegisteredIconName;
  onClick: () => void;
  isTooltipEndAligned?: boolean;
  ref?: Ref<HTMLButtonElement>;
};

export const IconSoloButton = ({
  onClick,
  ref,
  ...control
}: TIconSoloButtonProps) => (
  <IconSoloControl
    {...control}
    control={<Button ref={ref} onClick={onClick} />}
  />
);
