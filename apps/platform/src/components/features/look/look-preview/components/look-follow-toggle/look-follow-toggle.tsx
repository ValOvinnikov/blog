'use client';

import { ICONS } from '@blog/config';
import type { TLookFollow } from '@platform/components/features/look/look-preview/use-look-follow';
import { IconSoloToggle } from '@platform/components/shared/icon-solo-toggle';
import { useTranslations } from 'next-intl';

export type TLookFollowToggleProps = {
  follow: TLookFollow;
};

export const LookFollowToggle = ({
  follow: { isOn, isPaused, onPressedChange },
}: TLookFollowToggleProps) => {
  const t = useTranslations('lookFollow');

  return (
    <IconSoloToggle
      ariaLabel={t('followToggle')}
      tooltip={t('followToggle')}
      icon={ICONS.CROSSHAIR}
      isPressed={isOn && !isPaused}
      onPressedChange={onPressedChange}
      isTooltipEndAligned={true}
    />
  );
};
