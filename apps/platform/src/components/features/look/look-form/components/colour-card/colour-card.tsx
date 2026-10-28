import { LogoHueField } from '@platform/components/features/look/logo-hue-field';
import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { useLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { HueSlider } from '@platform/components/shared/hue-slider';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
import { buildAccentPreviewTokens } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import { useTranslations } from 'next-intl';

import { colourCardVariants } from './colour-card-variants';

export const ColourCard = () => {
  const { isArchived, archivedDescribedBy } = useSettingsFormState();
  const {
    values: { accentHue, logoHue },
    updateField,
    accentHueFieldId,
    isAccentHueRejected,
  } = useLookForm();
  const t = useTranslations('lookForm');
  const tHue = useTranslations('logoHueField');
  const logoHueLock = useLookFieldLock('logoHue');
  const { hueField, swatch, hueValue } = colourCardVariants();

  const accentHueLabel = t('accentHueLabel');
  const swatchColor = buildAccentPreviewTokens(accentHue, false)[
    '--brand-primary'
  ];

  return (
    <LookCard
      card="colour"
      title={t('colourHeading')}
      description={t('colourDescription')}
    >
      <LookField
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
            id={accentHueFieldId}
            ariaLabel={accentHueLabel}
            value={accentHue}
            onChange={(value) => updateField('accentHue', value)}
            isDisabled={isArchived}
            aria-describedby={archivedDescribedBy}
          />
          <span className={hueValue()}>
            {tHue('hueValue', { hue: accentHue })}
          </span>
        </div>
      </LookField>

      <LookField
        label={t('logoHueLabel')}
        hint={t('logoHueDescription')}
        isOptional={true}
        isGroup={true}
        lock={logoHueLock.lock}
      >
        <LogoHueField
          accentHue={accentHue}
          logoHue={logoHue}
          onChange={(hue) => updateField('logoHue', hue)}
          isDisabled={logoHueLock.isDisabled}
          aria-describedby={logoHueLock.describedBy}
        />
      </LookField>
    </LookCard>
  );
};
