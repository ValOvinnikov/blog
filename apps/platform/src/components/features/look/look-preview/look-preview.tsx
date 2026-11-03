'use client';

import {
  COOKIE_SETTINGS_BUTTON,
  ICONS,
  type TLocaleIsoCode,
} from '@blog/config';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { LookSample } from '@platform/components/features/site-preview/look-sample';
import { SampleCookieButton } from '@platform/components/features/site-preview/sample-cookie-button';
import { DeviceFrame } from '@platform/components/shared/device-frame';
import type { TIconToggleGroupProps } from '@platform/components/shared/icon-toggle-group';
import { PreviewFrame } from '@platform/components/shared/preview-frame';
import { DEVICE_FRAME_FIT } from '@platform/constants/device-frame';
import { MEDIA_QUERY } from '@platform/constants/media-query';
import {
  PREVIEW_HEADING_LAYOUT,
  PREVIEW_READER_STATE,
  type TPreviewReaderState,
} from '@platform/constants/preview';
import { toSampleBusyStyle } from '@platform/utils/sample-busy-style/sample-busy-style';
import { toSampleFooterStyle } from '@platform/utils/sample-footer-style/sample-footer-style';
import { toSampleHeaderStyle } from '@platform/utils/sample-header-style/sample-header-style';
import { buildSitePreviewTheme } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import { useMediaQuery } from '@platform/utils/use-media-query/use-media-query';
import { usePreviewColorScheme } from '@platform/utils/use-preview-color-scheme/use-preview-color-scheme';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useFrameAvailableHeight } from './use-frame-available-height';

export type TLookPreviewProps = {
  liveLocales: readonly TLocaleIsoCode[];
  hasReaderAccounts: boolean;
  siteHost: string;
};

export const LookPreview = ({
  liveLocales,
  hasReaderAccounts,
  siteHost,
}: TLookPreviewProps) => {
  const {
    tenantName,
    values,
    isSubmenuPreviewOpen,
    previewDevice,
    setPreviewDevice,
  } = useLookForm();
  const t = useTranslations('lookPreview');
  const tPreview = useTranslations('previewModeControl');
  const { mode, setMode, isDark } = usePreviewColorScheme();
  const [readerState, setReaderState] = useState<TPreviewReaderState>(
    PREVIEW_READER_STATE.SIGNED_OUT,
  );
  const [scale, setScale] = useState(1);
  const isPhoneTab = !useMediaQuery(MEDIA_QUERY.LG_UP);
  const { rootRef, stageRef, availableHeight } = useFrameAvailableHeight({
    device: previewDevice,
    scale,
  });
  const theme = buildSitePreviewTheme(values, isDark);
  const footer = toSampleFooterStyle(values);

  const readerGroup: TIconToggleGroupProps<TPreviewReaderState> = {
    ariaLabel: t('readerStateAriaLabel'),
    value: readerState,
    onChange: setReaderState,
    options: [
      {
        value: PREVIEW_READER_STATE.SIGNED_OUT,
        icon: ICONS.USER,
        ariaLabel: t('readerSignedOut'),
        tooltip: t('readerSignedOut'),
      },
      {
        value: PREVIEW_READER_STATE.SIGNED_IN,
        icon: ICONS.USER_CHECK,
        ariaLabel: t('readerSignedIn'),
        tooltip: t('readerSignedInTooltip', { name: t('sampleReaderName') }),
        isTooltipEndAligned: true,
      },
    ],
  };

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
        />
        <PreviewFrame.Toolbar
          device={previewDevice}
          onDeviceChange={setPreviewDevice}
          mode={mode}
          onModeChange={setMode}
          extraGroups={hasReaderAccounts ? [readerGroup] : []}
        />
        <PreviewFrame.Stage ref={stageRef} isCompact={isPhoneTab}>
          <DeviceFrame
            device={previewDevice}
            host={siteHost}
            fit={{ mode: DEVICE_FRAME_FIT.PAGE, availableHeight }}
            isDark={isDark}
            onScaleChange={setScale}
          >
            <LookSample
              brand={{ name: tenantName, logoSrc: values.logo.url }}
              theme={theme}
              liveLocales={liveLocales}
              header={toSampleHeaderStyle(values)}
              footer={footer}
              busy={toSampleBusyStyle(values)}
              hasReaderAccounts={hasReaderAccounts}
              isSignedIn={readerState === PREVIEW_READER_STATE.SIGNED_IN}
              isSubmenuOpen={isSubmenuPreviewOpen}
            />
            {footer.cookieSettingsButton === COOKIE_SETTINGS_BUTTON.SHOWN && (
              <DeviceFrame.Overlay>
                <SampleCookieButton theme={theme} />
              </DeviceFrame.Overlay>
            )}
          </DeviceFrame>
        </PreviewFrame.Stage>
        {!hasReaderAccounts && (
          <PreviewFrame.Status icon={ICONS.INFO}>
            {t('readerAccountsOff')}
          </PreviewFrame.Status>
        )}
      </PreviewFrame>
    </div>
  );
};
