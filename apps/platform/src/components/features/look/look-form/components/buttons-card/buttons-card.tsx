import {
  BUSY_BUTTON_STYLE,
  SPINNER_STYLE,
  type TBusyButtonStyle,
} from '@blog/config';
import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { useLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { OptionSelect } from '@platform/components/shared/option-select';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { useTranslations } from 'next-intl';

export const ButtonsCard = () => {
  const {
    values: { busyButtonStyle, spinnerStyle },
    updateField,
  } = useLookForm();
  const t = useTranslations('lookForm');
  const busyLock = useLookFieldLock('busyButtonStyle');
  const spinnerLock = useLookFieldLock('spinnerStyle');

  const busyOptions = Object.values(BUSY_BUTTON_STYLE).map((style) => ({
    value: style,
    label: t(`busyButtonStyleOptionLabel.${style}`),
  }));

  const spinnerOptions = Object.values(SPINNER_STYLE).map((style) => ({
    value: style,
    label: t(`spinnerStyleOptionLabel.${style}`),
  }));

  return (
    <LookCard
      card="buttons"
      title={t('buttonsHeading')}
      description={t('buttonsDescription')}
    >
      <LookField
        label={t('busyButtonStyleLabel')}
        hint={t('busyButtonStyleDescription')}
        isGroup={true}
        lock={busyLock.lock}
      >
        <SegmentedControl<TBusyButtonStyle>
          options={busyOptions}
          value={busyButtonStyle}
          onChange={(style) => updateField('busyButtonStyle', style)}
          isDisabled={busyLock.isDisabled}
          aria-describedby={busyLock.describedBy}
        />
      </LookField>

      <LookField
        label={t('spinnerStyleLabel')}
        hint={t('spinnerStyleDescription')}
        lock={spinnerLock.lock}
      >
        <OptionSelect
          options={spinnerOptions}
          value={spinnerStyle}
          onChange={(style) => updateField('spinnerStyle', style)}
          isDisabled={spinnerLock.isDisabled}
          aria-describedby={spinnerLock.describedBy}
        />
      </LookField>
    </LookCard>
  );
};
