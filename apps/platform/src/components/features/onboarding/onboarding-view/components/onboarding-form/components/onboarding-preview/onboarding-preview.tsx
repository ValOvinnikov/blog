'use client';

import type { TLocaleIsoCode, TPresetId } from '@blog/config';
import { LookSample } from '@platform/components/features/site-preview/look-sample';
import { PreviewFrame } from '@platform/components/shared/preview-frame';
import { PreviewModeControl } from '@platform/components/shared/preview-mode-control';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { applyPresetDefaults } from '@platform/utils/look-form-values/look-form-values';
import { buildSitePreviewTheme } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import { usePreviewColorScheme } from '@platform/utils/use-preview-color-scheme/use-preview-color-scheme';
import { useTranslations } from 'next-intl';

export type TOnboardingPreviewProps = {
  name: string;
  locale: TLocaleIsoCode;
  preset: TPresetId;
  accentHue: number;
};

export const OnboardingPreview = ({
  name,
  locale,
  preset,
  accentHue,
}: TOnboardingPreviewProps) => {
  const t = useTranslations('onboardingForm');
  const tPreview = useTranslations('previewModeControl');
  const { mode, setMode, isDark } = usePreviewColorScheme();
  const look = applyPresetDefaults(preset, defaultLookFormValues());

  return (
    <PreviewFrame
      ariaLabel={tPreview('livePreviewHeading')}
      widthControl={null}
      controls={<PreviewModeControl value={mode} onChange={setMode} />}
    >
      <LookSample
        tenantName={name || t('previewNamePlaceholder')}
        logoSrc={undefined}
        theme={buildSitePreviewTheme({ ...look, accentHue }, isDark)}
        liveLocales={[locale]}
        languageSwitcherStyle={look.languageSwitcherStyle}
        hasReaderAccounts={false}
      />
    </PreviewFrame>
  );
};
