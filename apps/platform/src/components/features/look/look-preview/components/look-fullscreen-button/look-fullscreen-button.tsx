'use client';

import { Dialog } from '@base-ui/react/dialog';
import { ICONS } from '@blog/config';
import { IconSoloControl } from '@platform/components/shared/icon-solo-control';
import { useTranslations } from 'next-intl';

export type TLookFullscreenButtonProps = {
  handle: Dialog.Handle<unknown>;
};

export const LookFullscreenButton = ({
  handle,
}: TLookFullscreenButtonProps) => {
  const t = useTranslations('lookFullscreen');

  return (
    <IconSoloControl
      control={<Dialog.Trigger handle={handle} />}
      ariaLabel={t('open')}
      tooltip={t('open')}
      icon={ICONS.MAXIMIZE}
      isTooltipEndAligned={true}
    />
  );
};
