import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { useLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { FontPicker } from '@platform/components/shared/font-picker';
import { useTranslations } from 'next-intl';

export const TypeCard = () => {
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
      card="type"
      title={t('typeHeading')}
      description={t('typeDescription')}
    >
      <LookField label={headingFontLabel} lock={headingFontLock.lock}>
        <FontPicker
          aria={{ describedBy: headingFontLock.describedBy }}
          value={headingFont}
          onChange={(font) => updateField('headingFont', font)}
          isDisabled={headingFontLock.isDisabled}
        />
      </LookField>

      <LookField label={bodyFontLabel} lock={bodyFontLock.lock}>
        <FontPicker
          aria={{ describedBy: bodyFontLock.describedBy }}
          value={bodyFont}
          onChange={(font) => updateField('bodyFont', font)}
          isDisabled={bodyFontLock.isDisabled}
        />
      </LookField>
    </LookCard>
  );
};
