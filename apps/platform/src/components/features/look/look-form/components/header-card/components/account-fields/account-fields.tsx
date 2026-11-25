import { LookChoiceField } from '@platform/components/features/look/look-form/components/look-choice-field';
import { toLookGlyphOptions } from '@platform/components/features/look/look-form/components/look-option-glyph';
import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PANEL_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
} from '@shinefold/config';
import { useTranslations } from 'next-intl';

export const AccountFields = () => {
  const t = useTranslations('lookForm');

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
      <LookChoiceField
        field="accountButtonStyle"
        label={t('accountButtonStyleLabel')}
        hint={t('accountButtonStyleDescription')}
        options={buttonOptions}
      />

      <LookChoiceField
        field="accountPanelStyle"
        label={t('accountPanelStyleLabel')}
        hint={t('accountPanelStyleDescription')}
        options={panelOptions}
      />

      <LookChoiceField
        field="accountPhonePlacement"
        label={t('accountPhonePlacementLabel')}
        hint={t('accountPhonePlacementDescription')}
        options={placementOptions}
      />
    </>
  );
};
