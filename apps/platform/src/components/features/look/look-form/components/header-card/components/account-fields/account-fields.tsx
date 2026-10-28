import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PANEL_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
  type TAccountButtonStyle,
  type TAccountPanelStyle,
  type TAccountPhonePlacement,
} from '@blog/config';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { useLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { useTranslations } from 'next-intl';

export const AccountFields = () => {
  const {
    values: { accountButtonStyle, accountPanelStyle, accountPhonePlacement },
    updateField,
  } = useLookForm();
  const t = useTranslations('lookForm');
  const buttonLock = useLookFieldLock('accountButtonStyle');
  const panelLock = useLookFieldLock('accountPanelStyle');
  const placementLock = useLookFieldLock('accountPhonePlacement');

  const buttonOptions = Object.values(ACCOUNT_BUTTON_STYLE).map((style) => ({
    value: style,
    label: t(`accountButtonStyleOptionLabel.${style}`),
  }));

  const panelOptions = Object.values(ACCOUNT_PANEL_STYLE).map((style) => ({
    value: style,
    label: t(`accountPanelStyleOptionLabel.${style}`),
  }));

  const placementOptions = Object.values(ACCOUNT_PHONE_PLACEMENT).map(
    (placement) => ({
      value: placement,
      label: t(`accountPhonePlacementOptionLabel.${placement}`),
    }),
  );

  return (
    <>
      <LookField
        label={t('accountButtonStyleLabel')}
        hint={t('accountButtonStyleDescription')}
        isGroup={true}
        lock={buttonLock.lock}
      >
        <SegmentedControl<TAccountButtonStyle>
          options={buttonOptions}
          value={accountButtonStyle}
          onChange={(style) => updateField('accountButtonStyle', style)}
          isDisabled={buttonLock.isDisabled}
          aria-describedby={buttonLock.describedBy}
        />
      </LookField>

      <LookField
        label={t('accountPanelStyleLabel')}
        hint={t('accountPanelStyleDescription')}
        isGroup={true}
        lock={panelLock.lock}
      >
        <SegmentedControl<TAccountPanelStyle>
          options={panelOptions}
          value={accountPanelStyle}
          onChange={(style) => updateField('accountPanelStyle', style)}
          isDisabled={panelLock.isDisabled}
          aria-describedby={panelLock.describedBy}
        />
      </LookField>

      <LookField
        label={t('accountPhonePlacementLabel')}
        hint={t('accountPhonePlacementDescription')}
        isGroup={true}
        lock={placementLock.lock}
      >
        <SegmentedControl<TAccountPhonePlacement>
          options={placementOptions}
          value={accountPhonePlacement}
          onChange={(placement) =>
            updateField('accountPhonePlacement', placement)
          }
          isDisabled={placementLock.isDisabled}
          aria-describedby={placementLock.describedBy}
        />
      </LookField>
    </>
  );
};
