'use client';

import { Dialog } from '@base-ui/react/dialog';
import type { TLocaleIsoCode } from '@blog/config';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { LookSample } from '@platform/components/features/site-preview/look-sample';
import { SampleCookieButton } from '@platform/components/features/site-preview/sample-cookie-button';
import { DeviceFrame } from '@platform/components/shared/device-frame';
import { PreviewFrame } from '@platform/components/shared/preview-frame';
import { DEVICE_FRAME_FIT } from '@platform/constants/device-frame';
import { MEDIA_QUERY } from '@platform/constants/media-query';
import { PREVIEW_HEADING_LAYOUT } from '@platform/constants/preview';
import type { TLookFollowTarget } from '@platform/utils/look-follow-target/look-follow-target';
import { toSampleBusyStyle } from '@platform/utils/sample-busy-style/sample-busy-style';
import { toSampleFooterStyle } from '@platform/utils/sample-footer-style/sample-footer-style';
import { toSampleHeaderStyle } from '@platform/utils/sample-header-style/sample-header-style';
import { buildSitePreviewTheme } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import { useMediaQuery } from '@platform/utils/use-media-query/use-media-query';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import { LookFollowMark } from './components/look-follow-mark';
import { LookFullscreenDialog } from './components/look-fullscreen-dialog';
import { LookPreviewSolos } from './components/look-preview-solos';
import { LookPreviewStatus } from './components/look-preview-status';
import { useFrameAvailableHeight } from './use-frame-available-height';
import { useLookFollow } from './use-look-follow';
import { useLookPreviewToolbar } from './use-look-preview-toolbar';

export type TLookPreviewProps = {
  liveLocales: readonly TLocaleIsoCode[];
  hasReaderAccounts: boolean;
  hasCookieBanner: boolean;
  siteHost: string;
  followTarget: TLookFollowTarget;
  isShown: boolean;
  isScrollingWithPage: boolean;
};

export const LookPreview = ({
  liveLocales,
  hasReaderAccounts,
  hasCookieBanner,
  siteHost,
  followTarget,
  isShown,
  isScrollingWithPage,
}: TLookPreviewProps) => {
  const { shownBrandName, values, isSubmenuPreviewOpen, previewDevice } =
    useLookForm();
  const tPreview = useTranslations('previewModeControl');
  const { toolbarProps, isDark, isSignedIn } =
    useLookPreviewToolbar(hasReaderAccounts);
  const [scale, setScale] = useState(1);
  const [fullscreenHandle] = useState(Dialog.createHandle);
  const fullscreenTriggerRef = useRef<HTMLButtonElement>(null);
  const isPhoneTab = !useMediaQuery(MEDIA_QUERY.LG_UP);
  const { rootRef, stageRef, availableHeight } = useFrameAvailableHeight(
    previewDevice,
    isScrollingWithPage,
  );
  const { frameRef, follow } = useLookFollow({
    target: followTarget,
    device: previewDevice,
    scale,
    isShown,
  });
  const theme = buildSitePreviewTheme(values, isDark);
  const footer = toSampleFooterStyle(values, hasCookieBanner);

  const solos = (
    <LookPreviewSolos
      follow={follow}
      fullscreenHandle={fullscreenHandle}
      fullscreenTriggerRef={fullscreenTriggerRef}
    />
  );
  const sample = (
    <>
      <LookSample
        brand={{ name: shownBrandName, logoSrc: values.logo.url }}
        theme={theme}
        liveLocales={liveLocales}
        header={toSampleHeaderStyle(values)}
        footer={footer}
        busy={toSampleBusyStyle(values)}
        hasReaderAccounts={hasReaderAccounts}
        isSignedIn={isSignedIn}
        isSubmenuOpen={isSubmenuPreviewOpen}
      />
      {footer.hasCookieSettingsButton && (
        <DeviceFrame.Overlay>
          <SampleCookieButton theme={theme} />
        </DeviceFrame.Overlay>
      )}
    </>
  );

  return (
    <div ref={rootRef}>
      <PreviewFrame
        ariaLabel={tPreview('livePreviewHeading')}
        isToolbarFirst={isPhoneTab}
        status={
          <LookPreviewStatus
            follow={follow}
            target={followTarget}
            hasReaderAccounts={hasReaderAccounts}
          />
        }
      >
        <PreviewFrame.Heading
          device={previewDevice}
          scale={scale}
          layout={
            isPhoneTab
              ? PREVIEW_HEADING_LAYOUT.PHONE_TAB
              : PREVIEW_HEADING_LAYOUT.SECTION
          }
          actions={isPhoneTab && solos}
        />
        <PreviewFrame.Toolbar {...toolbarProps}>
          {!isPhoneTab && solos}
        </PreviewFrame.Toolbar>
        <PreviewFrame.Stage ref={stageRef} isCompact={isPhoneTab}>
          <DeviceFrame
            ref={frameRef}
            device={previewDevice}
            host={siteHost}
            fit={{ mode: DEVICE_FRAME_FIT.PAGE, availableHeight }}
            isDark={isDark}
            onScaleChange={setScale}
            onHandScroll={follow.onHandScroll}
          >
            {sample}
            {follow.isFollowing && follow.row && (
              <LookFollowMark row={follow.row} scale={scale} />
            )}
          </DeviceFrame>
        </PreviewFrame.Stage>
      </PreviewFrame>
      <LookFullscreenDialog
        handle={fullscreenHandle}
        device={previewDevice}
        toolbar={<PreviewFrame.Toolbar {...toolbarProps} />}
        host={siteHost}
        isDark={isDark}
        finalFocus={fullscreenTriggerRef}
      >
        {sample}
      </LookFullscreenDialog>
    </div>
  );
};
