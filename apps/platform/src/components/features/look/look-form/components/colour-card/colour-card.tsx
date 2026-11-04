import { SIZE } from '@blog/config';
import { LogoHueField } from '@platform/components/features/look/logo-hue-field';
import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { PresetValueButton } from '@platform/components/features/look/look-form/components/preset-value-button';
import { useLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { AccentSwatch } from '@platform/components/shared/accent-swatch';
import { HueSlider } from '@platform/components/shared/hue-slider';
import { LOOK_ROW } from '@platform/constants/look-row';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
import { tv } from '@platform/utils/tv/tv';
import { useTranslations } from 'next-intl';

const colourCardVariants = tv({
  slots: {
    hueField: ['flex w-full items-center gap-3.5'],
    hueValue: [
      'shrink-0 text-right text-admin-12-5 tabular-nums text-admin-muted',
    ],
  },
});

export type TColourCardProps = {
  summary: string;
};

export const ColourCard = ({ summary }: TColourCardProps) => {
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
      summary={summary}
      summaryMark={<AccentSwatch hue={accentHue} size={SIZE.XS} />}
      card={LOOK_ROW.COLOUR}
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
        <PresetValueButton field="accentHue" fieldLabel={accentHueLabel} />
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
