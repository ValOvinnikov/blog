import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { PresetValueButton } from '@platform/components/features/look/look-form/components/preset-value-button';
import { useLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { FontPicker } from '@platform/components/shared/font-picker';
import { LOOK_ROW } from '@platform/constants/look-row';
import { useTranslations } from 'next-intl';

export type TTypeCardProps = {
  summary: string;
};

export const TypeCard = ({ summary }: TTypeCardProps) => {
  const {
    values: { headingFont, bodyFont },
    updateField,
  } = useLookForm();
  const t = useTranslations('lookForm');
  const headingFontLock = useLookFieldLock('headingFont');
  const bodyFontLock = useLookFieldLock('bodyFont');

  const headingFontLabel = t('headingFontLabel');
  const bodyFontLabel = t('bodyFontLabel');

  return (
    <LookCard
      summary={summary}
      card={LOOK_ROW.TYPE}
      description={t('typeDescription')}
    >
      <LookField
        field="headingFont"
        label={headingFontLabel}
        lock={headingFontLock.lock}
      >
        <FontPicker
          aria={{ describedBy: headingFontLock.describedBy }}
          value={headingFont}
          onChange={(font) => updateField('headingFont', font)}
          isDisabled={headingFontLock.isDisabled}
        />
        <PresetValueButton field="headingFont" fieldLabel={headingFontLabel} />
      </LookField>

      <LookField
        field="bodyFont"
        label={bodyFontLabel}
        lock={bodyFontLock.lock}
      >
        <FontPicker
          aria={{ describedBy: bodyFontLock.describedBy }}
          value={bodyFont}
          onChange={(font) => updateField('bodyFont', font)}
          isDisabled={bodyFontLock.isDisabled}
        />
        <PresetValueButton field="bodyFont" fieldLabel={bodyFontLabel} />
      </LookField>
    </LookCard>
  );
};
