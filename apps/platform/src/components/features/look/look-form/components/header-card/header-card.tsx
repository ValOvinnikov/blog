import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { LookChoiceField } from '@platform/components/features/look/look-form/components/look-choice-field';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { toLookGlyphOptions } from '@platform/components/features/look/look-form/components/look-option-glyph';
import { useLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookRowLock } from '@platform/components/features/look/look-form/use-look-row-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { OptionSelect } from '@platform/components/shared/option-select';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { LOOK_ROW } from '@platform/constants/look-row';
import { SELECT_APPEARANCE } from '@platform/constants/select-appearance';
import { CARD_FIELDS } from '@platform/utils/look-form-values/look-form-values';
import {
  HEADER_BAR_STYLE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
  type THeaderSubmenuStyle,
} from '@shinefold/config';
import { useTranslations } from 'next-intl';

import { AccountFields } from './components/account-fields/account-fields';
import { BackgroundFields } from './components/background-fields/background-fields';
import { HeaderControlShapeField } from './components/header-control-shape-field/header-control-shape-field';
import { HeaderControlStyleField } from './components/header-control-style-field/header-control-style-field';
import { NavLinkStyleField } from './components/nav-link-style-field/nav-link-style-field';
import { PreviewDeviceNote } from './components/preview-device-note/preview-device-note';
import { useSubmenuPreview } from './use-submenu-preview';

export type THeaderCardProps = {
  summary: string;
};

export const HeaderCard = ({ summary }: THeaderCardProps) => {
  const {
    values: { headerLayout, headerSubmenuStyle },
    updateField,
  } = useLookForm();
  const t = useTranslations('lookForm');
  const layoutLock = useLookFieldLock('headerLayout');
  const submenuStyleLock = useLookFieldLock('headerSubmenuStyle');
  const { lockLine, hasGrowthBadge } = useLookRowLock(
    CARD_FIELDS[LOOK_ROW.HEADER],
  );
  const { triggerProps, markChanged } = useSubmenuPreview();

  const layoutOptions = toLookGlyphOptions(
    'headerLayout',
    HEADER_LAYOUT,
    (layout) => t(`headerLayoutOptionLabel.${layout}`),
  );
  const submenuStyleOptions = toLookGlyphOptions(
    'headerSubmenuStyle',
    HEADER_SUBMENU_STYLE,
    (style) => t(`headerSubmenuStyleOptionLabel.${style}`),
  );
  const barStyleOptions = toLookGlyphOptions(
    'headerBarStyle',
    HEADER_BAR_STYLE,
    (style) => t(`headerBarStyleOptionLabel.${style}`),
  );

  return (
    <LookCard
      summary={summary}
      card={LOOK_ROW.HEADER}
      description={t('headerDescription')}
      lockLine={lockLine}
      hasGrowthBadge={hasGrowthBadge}
    >
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

      <LookChoiceField
        field="headerBarStyle"
        label={t('headerBarStyleLabel')}
        hint={t('headerBarStyleDescription')}
        options={barStyleOptions}
      />

      <BackgroundFields />

      <NavLinkStyleField />

      <HeaderControlStyleField />

      <HeaderControlShapeField />

      <AccountFields />
    </LookCard>
  );
};
