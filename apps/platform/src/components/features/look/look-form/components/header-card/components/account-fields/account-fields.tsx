import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PANEL_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
  type TAccountButtonStyle,
  type TAccountPanelStyle,
  type TAccountPhonePlacement,
} from '@blog/config';
import { toOptions } from '@blog/utils/primitives';
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

  const buttonOptions = toOptions(ACCOUNT_BUTTON_STYLE, (style) =>
    t(`accountButtonStyleOptionLabel.${style}`),
  );
  const panelOptions = toOptions(ACCOUNT_PANEL_STYLE, (style) =>
    t(`accountPanelStyleOptionLabel.${style}`),
  );
  const placementOptions = toOptions(ACCOUNT_PHONE_PLACEMENT, (placement) =>
    t(`accountPhonePlacementOptionLabel.${placement}`),
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
          aria={{ describedBy: buttonLock.describedBy }}
          options={buttonOptions}
          value={accountButtonStyle}
          onChange={(style) => updateField('accountButtonStyle', style)}
          isDisabled={buttonLock.isDisabled}
        />
      </LookField>

      <LookField
        label={t('accountPanelStyleLabel')}
        hint={t('accountPanelStyleDescription')}
        isGroup={true}
        lock={panelLock.lock}
      >
        <SegmentedControl<TAccountPanelStyle>
          aria={{ describedBy: panelLock.describedBy }}
          options={panelOptions}
          value={accountPanelStyle}
          onChange={(style) => updateField('accountPanelStyle', style)}
          isDisabled={panelLock.isDisabled}
        />
      </LookField>

      <LookField
        label={t('accountPhonePlacementLabel')}
        hint={t('accountPhonePlacementDescription')}
        isGroup={true}
        lock={placementLock.lock}
      >
        <SegmentedControl<TAccountPhonePlacement>
          aria={{ describedBy: placementLock.describedBy }}
          options={placementOptions}
          value={accountPhonePlacement}
          onChange={(placement) =>
            updateField('accountPhonePlacement', placement)
          }
          isDisabled={placementLock.isDisabled}
        />
      </LookField>
    </>
  );
};
