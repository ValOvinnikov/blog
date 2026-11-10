import { HEADER_CONTROL_STYLE, type THeaderControlStyle } from '@blog/config';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { PresetValueButton } from '@platform/components/features/look/look-form/components/preset-value-button';
import { useLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { useTranslations } from 'next-intl';

export const HeaderControlStyleField = () => {
  const {
    values: { headerControlStyle },
    updateField,
  } = useLookForm();
  const t = useTranslations('lookForm');
  const lock = useLookFieldLock('headerControlStyle');

  const options = Object.values(HEADER_CONTROL_STYLE).map((style) => ({
    value: style,
    label: t(`headerControlStyleOptionLabel.${style}`),
    description: t(`headerControlStyleOptionDescription.${style}`),
  }));
  const label = t('headerControlStyleLabel');

  return (
    <LookField
      field="headerControlStyle"
      label={label}
      hint={t('headerControlStyleDescription')}
      isGroup={true}
      labelId={lock.labelId}
      growthBadgeId={lock.growthBadgeId}
    >
      <SegmentedControl<THeaderControlStyle>
        aria={lock.aria}
        options={options}
        value={headerControlStyle}
        onChange={(style) => updateField('headerControlStyle', style)}
        isDisabled={lock.isDisabled}
        isLocked={lock.isLocked}
      />
      <PresetValueButton field="headerControlStyle" fieldLabel={label} />
    </LookField>
  );
};
