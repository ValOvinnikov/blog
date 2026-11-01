import { SIZE } from '@blog/config';
import { LogoHueField } from '@platform/components/features/look/logo-hue-field';
import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { useLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { AccentSwatch } from '@platform/components/shared/accent-swatch';
import { HueSlider } from '@platform/components/shared/hue-slider';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
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
  const { hueField, hueValue } = colourCardVariants();

  const accentHueLabel = t('accentHueLabel');

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
          <AccentSwatch hue={accentHue} size={SIZE.LG} />
          <HueSlider
            id={accentHueFieldId}
            name={{ ariaLabel: accentHueLabel }}
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
