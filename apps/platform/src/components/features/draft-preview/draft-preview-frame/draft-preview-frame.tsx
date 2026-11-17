'use client';

import { Button } from '@platform/components/shared/button';
import { ExternalLinkButton } from '@platform/components/shared/external-link-button';
import { IconToolbar } from '@platform/components/shared/icon-toolbar';
import { usePreviewDeviceGroup } from '@platform/components/shared/preview-device-group';
import { PreviewFrame } from '@platform/components/shared/preview-frame';
import { BUTTON_VARIANT } from '@platform/constants/button';
import {
  PREVIEW_DEVICE,
  PREVIEW_DEVICE_WIDTH,
  type TPreviewDevice,
} from '@platform/constants/preview';
import { SIZE } from '@shinefold/config';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { draftPreviewFrameVariants } from './draft-preview-frame-variants';

export type TDraftPreviewFrameProps = {
  frameUrl: string;
  publishedUrl: string;
};

export const DraftPreviewFrame = ({
  frameUrl,
  publishedUrl,
}: TDraftPreviewFrameProps) => {
  const t = useTranslations('draftPreview');
  const router = useRouter();
  const [device, setDevice] = useState<TPreviewDevice>(PREVIEW_DEVICE.DESKTOP);
  const [isReloading, startReload] = useTransition();
  const deviceGroup = usePreviewDeviceGroup(device, setDevice);
  const { frame } = draftPreviewFrameVariants();

  const handleReload = () => {
    startReload(() => router.refresh());
  };

  return (
    <PreviewFrame
      ariaLabel={t('frameRegionLabel')}
      controls={
        <IconToolbar ariaLabel={t('toolbarAriaLabel')} groups={[deviceGroup]}>
          <Button
            variant={BUTTON_VARIANT.SECONDARY}
            size={SIZE.SM}
            isPending={isReloading}
            pendingLabel={t('reloading')}
            onClick={handleReload}
          >
            {t('reload')}
          </Button>
          <ExternalLinkButton
            href={publishedUrl}
            variant={BUTTON_VARIANT.SECONDARY}
            size={SIZE.SM}
          >
            {t('openPublished')}
          </ExternalLinkButton>
        </IconToolbar>
      }
    >
      <iframe
        key={frameUrl}
        title={t('frameTitle')}
        src={frameUrl}
        className={frame()}
        style={{ width: PREVIEW_DEVICE_WIDTH[device] }}
      />
    </PreviewFrame>
  );
};
