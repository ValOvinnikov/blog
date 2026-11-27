import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { PresetValueButton } from '@platform/components/features/look/look-form/components/preset-value-button';
import { useLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { SampleSpinner } from '@platform/components/features/site-preview/sample-spinner';
import { LockedReason } from '@platform/components/shared/locked-reason';
import { OptionSelect } from '@platform/components/shared/option-select';
import { SELECT_APPEARANCE } from '@platform/constants/select-appearance';
import { BUSY_BUTTON_STYLE, ICONS, SPINNER_STYLE } from '@shinefold/config';
import { toOptions } from '@shinefold/utils/primitives';
import { useTranslations } from 'next-intl';

export const SpinnerStyleField = () => {
  const {
    values: { busyButtonStyle, spinnerStyle },
    updateField,
  } = useLookForm();
  const t = useTranslations('lookForm');
  const lock = useLookFieldLock('spinnerStyle');

  const options = toOptions(SPINNER_STYLE, (style) =>
    t(`spinnerStyleOptionLabel.${style}`),
  ).map((option) => ({
    ...option,
    glyph: <SampleSpinner variant={option.value} />,
    triggerGlyph: <SampleSpinner variant={option.value} isStill={true} />,
  }));
  const label = t('spinnerStyleLabel');

  return (
    <LookField
      field="spinnerStyle"
      label={label}
      hint={t('spinnerStyleDescription')}
      lock={lock}
    >
      <OptionSelect
        appearance={SELECT_APPEARANCE.COMPACT}
        aria={lock.aria}
        options={options}
        value={spinnerStyle}
        onChange={(style) => updateField('spinnerStyle', style)}
        lock={lock}
      />
      {busyButtonStyle === BUSY_BUTTON_STYLE.EDGE && (
        <LockedReason icon={ICONS.INFO}>{t('spinnerEdgeNote')}</LockedReason>
      )}
      <PresetValueButton field="spinnerStyle" fieldLabel={label} />
    </LookField>
  );
};
