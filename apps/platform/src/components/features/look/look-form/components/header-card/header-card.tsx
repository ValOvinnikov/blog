import {
  HEADER_BAR_STYLE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
  type THeaderBarStyle,
  type THeaderSubmenuStyle,
} from '@blog/config';
import { LookCard } from '@platform/components/features/look/look-form/components/look-card';
import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { useLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { OptionSelect } from '@platform/components/shared/option-select';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { useTranslations } from 'next-intl';

import { AccountFields } from './components/account-fields/account-fields';
import { useSubmenuPreview } from './use-submenu-preview';

export const HeaderCard = () => {
  const {
    values: { headerLayout, headerSubmenuStyle, headerBarStyle },
    updateField,
  } = useLookForm();
  const t = useTranslations('lookForm');
  const layoutLock = useLookFieldLock('headerLayout');
  const submenuStyleLock = useLookFieldLock('headerSubmenuStyle');
  const barStyleLock = useLookFieldLock('headerBarStyle');
  const { triggerProps, markChanged } = useSubmenuPreview();

  const layoutOptions = Object.values(HEADER_LAYOUT).map((layout) => ({
    value: layout,
    label: t(`headerLayoutOptionLabel.${layout}`),
  }));

  const submenuStyleOptions = Object.values(HEADER_SUBMENU_STYLE).map(
    (style) => ({
      value: style,
      label: t(`headerSubmenuStyleOptionLabel.${style}`),
    }),
  );

  const barStyleOptions = Object.values(HEADER_BAR_STYLE).map((style) => ({
    value: style,
    label: t(`headerBarStyleOptionLabel.${style}`),
  }));

  return (
    <LookCard
      card="header"
      title={t('headerHeading')}
      description={t('headerDescription')}
    >
      <LookField
        label={t('headerLayoutLabel')}
        hint={t('headerLayoutDescription')}
        lock={layoutLock.lock}
      >
        <OptionSelect
          options={layoutOptions}
          value={headerLayout}
          onChange={(layout) => updateField('headerLayout', layout)}
          isDisabled={layoutLock.isDisabled}
          aria-describedby={layoutLock.describedBy}
        />
      </LookField>

      <div {...triggerProps}>
        <LookField
          label={t('headerSubmenuStyleLabel')}
          hint={t('headerSubmenuStyleDescription')}
          isGroup={true}
          lock={submenuStyleLock.lock}
        >
          <SegmentedControl<THeaderSubmenuStyle>
            options={submenuStyleOptions}
            value={headerSubmenuStyle}
            onChange={(style) => {
              updateField('headerSubmenuStyle', style);
              markChanged();
            }}
            isDisabled={submenuStyleLock.isDisabled}
            aria-describedby={submenuStyleLock.describedBy}
          />
        </LookField>
      </div>

      <LookField
        label={t('headerBarStyleLabel')}
        hint={t('headerBarStyleDescription')}
        isGroup={true}
        lock={barStyleLock.lock}
      >
        <SegmentedControl<THeaderBarStyle>
          options={barStyleOptions}
          value={headerBarStyle}
          onChange={(style) => updateField('headerBarStyle', style)}
          isDisabled={barStyleLock.isDisabled}
          aria-describedby={barStyleLock.describedBy}
        />
      </LookField>

      <AccountFields />
    </LookCard>
  );
};
