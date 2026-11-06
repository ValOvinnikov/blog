'use client';

import { Toggle } from '@base-ui/react/toggle';
import { ICONS } from '@blog/config';
import { Icon } from '@platform/components/shared/icon';
import { ICON_SIZE } from '@platform/constants/icon';

import { revealToggleVariants } from './reveal-toggle-variants';

export type TRevealToggleProps = {
  isShown: boolean;
  onShownChange: (isShown: boolean) => void;
  showLabel: string;
  hideLabel: string;
};

export const RevealToggle = ({
  isShown,
  onShownChange,
  showLabel,
  hideLabel,
}: TRevealToggleProps) => {
  const label = isShown ? hideLabel : showLabel;

  return (
    <Toggle
      pressed={isShown}
      onPressedChange={onShownChange}
      aria-label={label}
      title={label}
      className={revealToggleVariants()}
    >
      <Icon name={isShown ? ICONS.EYE_OFF : ICONS.EYE} size={ICON_SIZE.MD} />
    </Toggle>
  );
};
