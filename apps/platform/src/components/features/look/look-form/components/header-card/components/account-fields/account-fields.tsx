import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PANEL_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
  type TAccountButtonStyle,
  type TAccountPanelStyle,
  type TAccountPhonePlacement,
} from '@blog/config';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { LookOptionGlyph } from '@platform/components/features/look/look-form/components/look-option-glyph';
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
    glyph: <LookOptionGlyph field="accountButtonStyle" value={style} />,
  }));
  const panelOptions = Object.values(ACCOUNT_PANEL_STYLE).map((style) => ({
    value: style,
    label: t(`accountPanelStyleOptionLabel.${style}`),
    glyph: <LookOptionGlyph field="accountPanelStyle" value={style} />,
  }));
  const placementOptions = Object.values(ACCOUNT_PHONE_PLACEMENT).map(
    (placement) => ({
      value: placement,
      label: t(`accountPhonePlacementOptionLabel.${placement}`),
      glyph: (
        <LookOptionGlyph field="accountPhonePlacement" value={placement} />
      ),
    }),
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
