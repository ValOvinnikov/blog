import { toLookGlyphOptions } from '@platform/components/features/look/look-form/components/look-option-glyph';
import { LookPresetChoiceField } from '@platform/components/features/look/look-form/components/look-preset-choice-field';
import {
  HEADER_ACTION_PHONE_PLACEMENT,
  HEADER_ACTION_STYLE,
} from '@shinefold/config';
import { useTranslations } from 'next-intl';

export const HeaderActionFields = () => {
  const t = useTranslations('lookForm');

  const styleOptions = toLookGlyphOptions(
    'headerActionStyle',
    HEADER_ACTION_STYLE,
    (style) => t(`headerActionStyleOptionLabel.${style}`),
  );
  const placementOptions = toLookGlyphOptions(
    'headerActionPhonePlacement',
    HEADER_ACTION_PHONE_PLACEMENT,
    (placement) => t(`headerActionPhonePlacementOptionLabel.${placement}`),
  );

  return (
    <>
      <LookPresetChoiceField
        field="headerActionStyle"
        label={t('headerActionStyleLabel')}
        hint={t('headerActionStyleDescription')}
        options={styleOptions}
      />

      <LookPresetChoiceField
        field="headerActionPhonePlacement"
        label={t('headerActionPhonePlacementLabel')}
        hint={t('headerActionPhonePlacementDescription')}
        options={placementOptions}
      />
    </>
  );
};
