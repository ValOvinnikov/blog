'use client';

import type { TLocaleIsoCode, TPresetId } from '@blog/config';
import type { TOnboardingPreviewOptions } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/use-onboarding-preview-options';
import { LookSample } from '@platform/components/features/site-preview/look-sample';
import { SampleCookieButton } from '@platform/components/features/site-preview/sample-cookie-button';
import { DeviceFrame } from '@platform/components/shared/device-frame';
import { PreviewFrame } from '@platform/components/shared/preview-frame';
import { DEVICE_FRAME_FIT } from '@platform/constants/device-frame';
import { ONBOARDING_PREVIEW } from '@platform/constants/onboarding';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { applyPresetDefaults } from '@platform/utils/look-form-values/look-form-values';
import { toSampleBusyStyle } from '@platform/utils/sample-busy-style/sample-busy-style';
import { toSampleFooterStyle } from '@platform/utils/sample-footer-style/sample-footer-style';
import { toSampleHeaderStyle } from '@platform/utils/sample-header-style/sample-header-style';
import { buildSitePreviewTheme } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import { tv } from '@platform/utils/tv/tv';
import { useElementSize } from '@platform/utils/use-element-size/use-element-size';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import { PreviewSiteAddress } from './components/preview-site-address/preview-site-address';

const onboardingPreviewVariants = tv({
  slots: { section: [], stage: [] },
  variants: {
    isPhone: {
      true: { section: ['gap-2.5'] },
      false: {},
    },
    isFull: {
      true: {
        section: ['min-h-0 flex-1'],
        stage: ['min-h-0 flex-1 overflow-hidden'],
      },
      false: {},
    },
  },
});

export type TOnboardingPreviewProps = {
  name: string;
  siteAddress: string;
  locale: TLocaleIsoCode;
  preset: TPresetId;
  accentHue: number;
  isPhone: boolean;
  isFull: boolean;
  options: TOnboardingPreviewOptions;
};

export const OnboardingPreview = ({
  name,
  siteAddress,
  locale,
  preset,
  accentHue,
  isPhone,
  isFull,
  options: { device, setDevice, mode, setMode, isDark },
}: TOnboardingPreviewProps) => {
  const t = useTranslations('onboardingForm');
  const tPreview = useTranslations('previewModeControl');
  const [scale, setScale] = useState(1);
  const stageRef = useRef<HTMLDivElement>(null);
  const stageSize = useElementSize(stageRef);
  const look = {
    ...applyPresetDefaults(preset, defaultLookFormValues()),
    accentHue,
  };
  const theme = buildSitePreviewTheme(look, isDark);
  const isAddressOnOwnLine =
    isPhone ||
    (stageSize?.width ?? Number.POSITIVE_INFINITY) <
      ONBOARDING_PREVIEW.ADDRESS_ROW_MIN_STAGE_WIDTH;
  const { section, stage } = onboardingPreviewVariants({ isPhone, isFull });

  return (
    <PreviewFrame
      ariaLabel={tPreview('livePreviewHeading')}
      className={section()}
    >
      <PreviewFrame.Heading device={device} scale={scale} isAlwaysLong={true} />
      <PreviewFrame.Toolbar
        device={device}
        onDeviceChange={setDevice}
        mode={mode}
        onModeChange={setMode}
        isEndOnOwnLine={isAddressOnOwnLine}
      >
        <PreviewSiteAddress address={siteAddress} />
      </PreviewFrame.Toolbar>
      <PreviewFrame.Stage
        ref={stageRef}
        isCompact={isPhone}
        className={stage()}
      >
        <DeviceFrame
          device={device}
          fit={{
            mode: DEVICE_FRAME_FIT.STAGE,
            availableHeight: isFull ? stageSize?.height : undefined,
          }}
          isDark={isDark}
          onScaleChange={setScale}
        >
          <LookSample
            brand={{
              name: name || t('previewNamePlaceholder'),
              logoSrc: undefined,
            }}
            theme={theme}
            liveLocales={[locale]}
            header={toSampleHeaderStyle(look)}
            footer={toSampleFooterStyle(look)}
            busy={toSampleBusyStyle(look)}
            hasReaderAccounts={false}
            shouldAlwaysShowLanguageSwitcher={true}
          />
          <DeviceFrame.Overlay>
            <SampleCookieButton theme={theme} />
          </DeviceFrame.Overlay>
        </DeviceFrame>
      </PreviewFrame.Stage>
    </PreviewFrame>
  );
};
