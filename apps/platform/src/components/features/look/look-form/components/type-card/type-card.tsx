import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { FontPicker } from '@platform/components/shared/font-picker';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
import { useTranslations } from 'next-intl';

export const TypeCard = () => {
  const { isArchived, archivedDescribedBy } = useSettingsFormState();
  const {
    values: { headingFont, bodyFont },
    updateField,
  } = useLookForm();
  const t = useTranslations('lookForm');

  const headingFontLabel = t('headingFontLabel');
  const bodyFontLabel = t('bodyFontLabel');

  return (
    <LookCard
      card="type"
      title={t('typeHeading')}
      description={t('typeDescription')}
    >
      <LookField label={headingFontLabel} isGroup={true}>
        <FontPicker
          value={headingFont}
          onChange={(font) => updateField('headingFont', font)}
          isDisabled={isArchived}
          aria-describedby={archivedDescribedBy}
        />
      </LookField>

      <LookField label={bodyFontLabel} isGroup={true}>
        <FontPicker
          value={bodyFont}
          onChange={(font) => updateField('bodyFont', font)}
          isDisabled={isArchived}
          aria-describedby={archivedDescribedBy}
        />
      </LookField>
    </LookCard>
  );
};
