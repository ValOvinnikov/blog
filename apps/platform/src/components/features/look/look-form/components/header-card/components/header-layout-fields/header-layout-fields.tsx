import { HeaderBackgroundField } from '@platform/components/features/look/look-form/components/header-card/components/header-background-field/header-background-field';
import { PreviewDeviceNote } from '@platform/components/features/look/look-form/components/header-card/components/preview-device-note/preview-device-note';
import { useSubmenuPreview } from '@platform/components/features/look/look-form/components/header-card/use-submenu-preview';
import { LookChoiceField } from '@platform/components/features/look/look-form/components/look-choice-field';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { toLookGlyphOptions } from '@platform/components/features/look/look-form/components/look-option-glyph';
import { useLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { OptionSelect } from '@platform/components/shared/option-select';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { SELECT_APPEARANCE } from '@platform/constants/select-appearance';
import {
  HEADER_BAR_STYLE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
  type THeaderSubmenuStyle,
} from '@shinefold/config';
import { useTranslations } from 'next-intl';

export const HeaderLayoutFields = () => {
  const {
    values: { headerLayout, headerSubmenuStyle },
    updateField,
  } = useLookForm();
  const t = useTranslations('lookForm');
  const layoutLock = useLookFieldLock('headerLayout');
  const submenuStyleLock = useLookFieldLock('headerSubmenuStyle');
  const { triggerProps, markChanged } = useSubmenuPreview();

  const layoutOptions = toLookGlyphOptions(
    'headerLayout',
    HEADER_LAYOUT,
    (layout) => t(`headerLayoutOptionLabel.${layout}`),
  );
  const barStyleOptions = toLookGlyphOptions(
    'headerBarStyle',
    HEADER_BAR_STYLE,
    (style) => t(`headerBarStyleOptionLabel.${style}`),
  );
  const submenuStyleOptions = toLookGlyphOptions(
    'headerSubmenuStyle',
    HEADER_SUBMENU_STYLE,
    (style) => t(`headerSubmenuStyleOptionLabel.${style}`),
  );

  return (
    <>
      <LookField
        field="headerLayout"
        label={t('headerLayoutLabel')}
        hint={t('headerLayoutDescription')}
        lock={layoutLock}
      >
        <OptionSelect
          appearance={SELECT_APPEARANCE.COMPACT}
          aria={layoutLock.aria}
          options={layoutOptions}
          value={headerLayout}
          onChange={(layout) => updateField('headerLayout', layout)}
          lock={layoutLock}
        />
      </LookField>
      <PreviewDeviceNote />
      <LookChoiceField
        field="headerBarStyle"
        label={t('headerBarStyleLabel')}
        hint={t('headerBarStyleDescription')}
        options={barStyleOptions}
      />
      <HeaderBackgroundField />
      <div {...triggerProps}>
        <LookField
          field="headerSubmenuStyle"
          label={t('headerSubmenuStyleLabel')}
          hint={t('headerSubmenuStyleDescription')}
          isGroup={true}
          lock={submenuStyleLock}
        >
          <SegmentedControl<THeaderSubmenuStyle>
            aria={submenuStyleLock.aria}
            options={submenuStyleOptions}
            value={headerSubmenuStyle}
            onChange={(style) => {
              updateField('headerSubmenuStyle', style);
              markChanged();
            }}
            lock={submenuStyleLock}
          />
        </LookField>
      </div>
    </>
  );
};
