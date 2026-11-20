'use client';

import { Button } from '@platform/components/shared/button';
import { DeviceFrame } from '@platform/components/shared/device-frame';
import { ExternalLinkButton } from '@platform/components/shared/external-link-button';
import { IconToolbar } from '@platform/components/shared/icon-toolbar';
import { usePreviewDeviceGroup } from '@platform/components/shared/preview-device-group';
import { PreviewFrame } from '@platform/components/shared/preview-frame';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { DEVICE_FRAME_FIT } from '@platform/constants/device-frame';
import {
  PREVIEW_DEVICE,
  PREVIEW_DEVICE_HEIGHT,
  type TPreviewDevice,
} from '@platform/constants/preview';
import { SIZE } from '@shinefold/config';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { draftPreviewFrameVariants } from './draft-preview-frame-variants';

const PAGE_FIT = { mode: DEVICE_FRAME_FIT.PAGE };

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
  const { host } = new URL(publishedUrl);

  const handleReload = () => {
    startReload(() => router.refresh());
  };

  return (
    <PreviewFrame
      ariaLabel={t('frameRegionLabel')}
      controls={
        <IconToolbar ariaLabel={t('toolbarAriaLabel')} groups={[deviceGroup]} />
      }
      actions={
        <>
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
        </>
      }
    >
      <PreviewFrame.Stage>
        <DeviceFrame
          device={device}
          chrome={{ host, isDark: false }}
          fit={PAGE_FIT}
          isInteractive={true}
        >
          <iframe
            key={frameUrl}
            title={t('frameTitle')}
            src={frameUrl}
            className={frame()}
            style={{ height: PREVIEW_DEVICE_HEIGHT[device] }}
          />
        </DeviceFrame>
      </PreviewFrame.Stage>
    </PreviewFrame>
  );
};
