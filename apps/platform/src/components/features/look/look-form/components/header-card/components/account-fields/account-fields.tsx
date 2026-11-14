import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PANEL_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
  type TAccountButtonStyle,
  type TAccountPanelStyle,
  type TAccountPhonePlacement,
} from '@blog/config';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { toLookGlyphOptions } from '@platform/components/features/look/look-form/components/look-option-glyph';
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

  const buttonOptions = toLookGlyphOptions(
    'accountButtonStyle',
    ACCOUNT_BUTTON_STYLE,
    (style) => t(`accountButtonStyleOptionLabel.${style}`),
  );
  const panelOptions = toLookGlyphOptions(
    'accountPanelStyle',
    ACCOUNT_PANEL_STYLE,
    (style) => t(`accountPanelStyleOptionLabel.${style}`),
  );
  const placementOptions = toLookGlyphOptions(
    'accountPhonePlacement',
    ACCOUNT_PHONE_PLACEMENT,
    (placement) => t(`accountPhonePlacementOptionLabel.${placement}`),
  );

  return (
    <>
      <LookField
        field="accountButtonStyle"
        label={t('accountButtonStyleLabel')}
        hint={t('accountButtonStyleDescription')}
        isGroup={true}
        labelId={buttonLock.labelId}
        growthBadgeId={buttonLock.growthBadgeId}
      >
        <SegmentedControl<TAccountButtonStyle>
          aria={buttonLock.aria}
          options={buttonOptions}
          value={accountButtonStyle}
          onChange={(style) => updateField('accountButtonStyle', style)}
          lock={buttonLock}
        />
      </LookField>

      <LookField
        field="accountPanelStyle"
        label={t('accountPanelStyleLabel')}
        hint={t('accountPanelStyleDescription')}
        isGroup={true}
        labelId={panelLock.labelId}
        growthBadgeId={panelLock.growthBadgeId}
      >
        <SegmentedControl<TAccountPanelStyle>
          aria={panelLock.aria}
          options={panelOptions}
          value={accountPanelStyle}
          onChange={(style) => updateField('accountPanelStyle', style)}
          lock={panelLock}
        />
      </LookField>

      <LookField
        field="accountPhonePlacement"
        label={t('accountPhonePlacementLabel')}
        hint={t('accountPhonePlacementDescription')}
        isGroup={true}
        labelId={placementLock.labelId}
        growthBadgeId={placementLock.growthBadgeId}
      >
        <SegmentedControl<TAccountPhonePlacement>
          aria={placementLock.aria}
          options={placementOptions}
          value={accountPhonePlacement}
          onChange={(placement) =>
            updateField('accountPhonePlacement', placement)
          }
          lock={placementLock}
        />
      </LookField>
    </>
  );
};
