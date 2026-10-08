import type { TFontChoice } from '@blog/config';
import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { FontPicker } from '@platform/components/shared/font-picker';
import type { TLookFormFieldSetter } from '@platform/utils/default-look-values/default-look-values';
import { useTranslations } from 'next-intl';

export type TTypeCardProps = {
  headingFont: TFontChoice;
  bodyFont: TFontChoice;
  onFieldChange: TLookFormFieldSetter;
  hasUnsavedChanges: boolean;
  isArchived: boolean;
  archivedNoticeId: string;
};

export const TypeCard = ({
  headingFont,
  bodyFont,
  onFieldChange,
  hasUnsavedChanges,
  isArchived,
  archivedNoticeId,
}: TTypeCardProps) => {
  const t = useTranslations('lookForm');
  const archivedDescribedBy = isArchived ? archivedNoticeId : undefined;

  const headingFontLabel = t('headingFontLabel');
  const bodyFontLabel = t('bodyFontLabel');

  return (
    <LookCard
      title={t('typeHeading')}
      description={t('typeDescription')}
      hasUnsavedChanges={hasUnsavedChanges}
    >
      <LookField label={headingFontLabel}>
        <FontPicker
          ariaLabel={headingFontLabel}
          value={headingFont}
          onChange={(font) => onFieldChange('headingFont', font)}
          isDisabled={isArchived}
          aria-describedby={archivedDescribedBy}
        />
      </LookField>

      <LookField label={bodyFontLabel}>
        <FontPicker
          ariaLabel={bodyFontLabel}
          value={bodyFont}
          onChange={(font) => onFieldChange('bodyFont', font)}
          isDisabled={isArchived}
          aria-describedby={archivedDescribedBy}
        />
      </LookField>
    </LookCard>
  );
};
