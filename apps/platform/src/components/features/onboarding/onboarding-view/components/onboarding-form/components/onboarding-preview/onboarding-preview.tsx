'use client';

import type { TLocaleIsoCode, TPresetId } from '@blog/config';
import { FrontPageSample } from '@platform/components/features/site-preview/front-page-sample';
import { PreviewFrame } from '@platform/components/shared/preview-frame';
import { PreviewModeControl } from '@platform/components/shared/preview-mode-control';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { applyPresetDefaults } from '@platform/utils/look-form-values/look-form-values';
import { toSampleHeaderStyle } from '@platform/utils/sample-header-style/sample-header-style';
import { buildSitePreviewTheme } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import { usePreviewColorScheme } from '@platform/utils/use-preview-color-scheme/use-preview-color-scheme';
import { useTranslations } from 'next-intl';

import { PreviewAddressBar } from './components/preview-address-bar/preview-address-bar';
import { onboardingPreviewVariants } from './onboarding-preview-variants';

export type TOnboardingPreviewProps = {
  name: string;
  siteAddress: string;
  locale: TLocaleIsoCode;
  preset: TPresetId;
  accentHue: number;
};

export const OnboardingPreview = ({
  name,
  siteAddress,
  locale,
  preset,
  accentHue,
}: TOnboardingPreviewProps) => {
  const t = useTranslations('onboardingForm');
  const tPreview = useTranslations('previewModeControl');
  const { mode, setMode, isDark } = usePreviewColorScheme();
  const look = applyPresetDefaults(preset, defaultLookFormValues());
  const { browser, site } = onboardingPreviewVariants();

  return (
    <PreviewFrame
      ariaLabel={tPreview('livePreviewHeading')}
      widthControl={null}
      controls={<PreviewModeControl value={mode} onChange={setMode} />}
    >
      <div className={browser()}>
        <PreviewAddressBar address={siteAddress} />
        <div className={site()}>
          <FrontPageSample
            tenantName={name || t('previewNamePlaceholder')}
            theme={buildSitePreviewTheme({ ...look, accentHue }, isDark)}
            liveLocales={[locale]}
            header={toSampleHeaderStyle(look)}
          />
        </div>
      </div>
    </PreviewFrame>
  );
};
