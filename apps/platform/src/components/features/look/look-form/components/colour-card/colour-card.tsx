import { LogoHueField } from '@platform/components/features/look/logo-hue-field';
import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { HueSlider } from '@platform/components/shared/hue-slider';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
import type { TLookFormFieldSetter } from '@platform/utils/default-look-values/default-look-values';
import {
  accentHueGradient,
  buildAccentPreviewTokens,
} from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import { useTranslations } from 'next-intl';

import { colourCardVariants } from './colour-card-variants';

export type TColourCardProps = {
  accentHue: number;
  accentHueFieldId: string;
  isAccentHueRejected: boolean;
  logoHue: number | undefined;
  onFieldChange: TLookFormFieldSetter;
  hasUnsavedChanges: boolean;
};

export const ColourCard = ({
  accentHue,
  accentHueFieldId,
  isAccentHueRejected,
  logoHue,
  onFieldChange,
  hasUnsavedChanges,
}: TColourCardProps) => {
  const { isArchived, archivedDescribedBy } = useSettingsFormState();
  const t = useTranslations('lookForm');
  const { hueField, swatch, hueValue } = colourCardVariants();

  const accentHueLabel = t('accentHueLabel');
  const swatchColor = buildAccentPreviewTokens(accentHue, false)[
    '--brand-primary'
  ];

  return (
    <LookCard
      title={t('colourHeading')}
      description={t('colourDescription')}
      hasUnsavedChanges={hasUnsavedChanges}
    >
      <LookField
        id={accentHueFieldId}
        label={accentHueLabel}
        hint={t('accentHueDescription')}
        error={isAccentHueRejected ? t('accentHueInaccessible') : undefined}
      >
        <div className={hueField()}>
          <span
            className={swatch()}
            aria-hidden="true"
            style={{ background: swatchColor }}
          />
          <HueSlider
            ariaLabel={accentHueLabel}
            value={accentHue}
            onChange={(value) => onFieldChange('accentHue', value)}
            isDisabled={isArchived}
            aria-describedby={archivedDescribedBy}
            trackStyle={{ background: accentHueGradient() }}
          />
          <span className={hueValue()}>{accentHue}°</span>
        </div>
      </LookField>

      <LookField
        label={t('logoHueLabel')}
        hint={t('logoHueDescription')}
        isOptional={true}
        isGroup={true}
      >
        <LogoHueField
          accentHue={accentHue}
          logoHue={logoHue}
          onChange={(hue) => onFieldChange('logoHue', hue)}
          isDark={false}
          isDisabled={isArchived}
          aria-describedby={archivedDescribedBy}
        />
      </LookField>
    </LookCard>
  );
};
