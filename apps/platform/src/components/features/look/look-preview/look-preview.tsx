'use client';

import { COOKIE_SETTINGS_BUTTON, type TLocaleIsoCode } from '@blog/config';
import { useLookPresetName } from '@platform/components/features/look/look-form/use-look-preset-name';
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
import { usePreviewColorScheme } from '@platform/utils/use-preview-color-scheme/use-preview-color-scheme';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { LookFollowMark } from './components/look-follow-mark';
import { LookFollowStatus } from './components/look-follow-status';
import { LookFollowToggle } from './components/look-follow-toggle';
import { useFrameAvailableHeight } from './use-frame-available-height';
import { useLookFollow } from './use-look-follow';
import { useReaderGroup } from './use-reader-group';

export type TLookPreviewProps = {
  liveLocales: readonly TLocaleIsoCode[];
  hasReaderAccounts: boolean;
  siteHost: string;
  followTarget: TLookFollowTarget;
  isShown: boolean;
};

export const LookPreview = ({
  liveLocales,
  hasReaderAccounts,
  siteHost,
  followTarget,
  isShown,
}: TLookPreviewProps) => {
  const {
    tenantName,
    values,
    hasLockedFields,
    isSubmenuPreviewOpen,
    previewDevice,
    setPreviewDevice,
  } = useLookForm();
  const t = useTranslations('lookPreview');
  const tPreview = useTranslations('previewModeControl');
  const tFollow = useTranslations('lookFollow');
  const presetName = useLookPresetName();
  const { mode, setMode, isDark } = usePreviewColorScheme();
  const { readerGroup, isSignedIn } = useReaderGroup();
  const [scale, setScale] = useState(1);
  const isPhoneTab = !useMediaQuery(MEDIA_QUERY.LG_UP);
  const { rootRef, stageRef, availableHeight } = useFrameAvailableHeight({
    device: previewDevice,
    scale,
  });
  const { frameRef, follow } = useLookFollow({
    target: followTarget,
    device: previewDevice,
    scale,
    isShown,
  });
  const theme = buildSitePreviewTheme(values, isDark);
  const footer = toSampleFooterStyle(values);

  const followToggle = <LookFollowToggle follow={follow} />;

  return (
    <div ref={rootRef}>
      <PreviewFrame
        ariaLabel={tPreview('livePreviewHeading')}
        isToolbarFirst={isPhoneTab}
      >
        <PreviewFrame.Heading
          device={previewDevice}
          scale={scale}
          layout={
            isPhoneTab
              ? PREVIEW_HEADING_LAYOUT.PHONE_TAB
              : PREVIEW_HEADING_LAYOUT.SECTION
          }
          actions={isPhoneTab && followToggle}
        />
        <PreviewFrame.Toolbar
          device={previewDevice}
          onDeviceChange={setPreviewDevice}
          mode={mode}
          onModeChange={setMode}
          extraGroups={hasReaderAccounts ? [readerGroup] : []}
        >
          {!isPhoneTab && followToggle}
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
            <LookSample
              brand={{ name: tenantName, logoSrc: values.logo.url }}
              theme={theme}
              liveLocales={liveLocales}
              header={toSampleHeaderStyle(values)}
              footer={footer}
              busy={toSampleBusyStyle(values)}
              hasReaderAccounts={hasReaderAccounts}
              isSignedIn={isSignedIn}
              isSubmenuOpen={isSubmenuPreviewOpen}
            />
            {follow.isFollowing && follow.row && (
              <LookFollowMark row={follow.row} scale={scale} />
            )}
            {footer.cookieSettingsButton === COOKIE_SETTINGS_BUTTON.SHOWN && (
              <DeviceFrame.Overlay>
                <SampleCookieButton theme={theme} />
              </DeviceFrame.Overlay>
            )}
          </DeviceFrame>
        </PreviewFrame.Stage>
        <LookFollowStatus
          follow={follow}
          target={followTarget}
          device={previewDevice}
          isShortLine={isPhoneTab || !hasReaderAccounts}
          readerNote={hasReaderAccounts ? undefined : t('readerAccountsOff')}
          planNote={
            hasLockedFields
              ? tFollow('freeSample', { preset: presetName })
              : undefined
          }
        />
      </PreviewFrame>
    </div>
  );
};
