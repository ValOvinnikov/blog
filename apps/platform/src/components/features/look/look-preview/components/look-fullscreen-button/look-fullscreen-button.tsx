'use client';

import { Dialog } from '@base-ui/react/dialog';
import { ICONS } from '@blog/config';
import { IconSoloControl } from '@platform/components/shared/icon-solo-control';
import { useTranslations } from 'next-intl';
import type { Ref } from 'react';

export type TLookFullscreenButtonProps = {
  handle: Dialog.Handle<unknown>;
  triggerRef: Ref<HTMLButtonElement>;
};

export const LookFullscreenButton = ({
  handle,
  triggerRef,
}: TLookFullscreenButtonProps) => {
  const t = useTranslations('lookFullscreen');

  return (
    <IconSoloControl
      control={<Dialog.Trigger ref={triggerRef} handle={handle} />}
      ariaLabel={t('open')}
      tooltip={t('open')}
      icon={ICONS.MAXIMIZE}
      isTooltipEndAligned={true}
    />
  );
};
