import {
  HEADER_BAR_STYLE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
  type THeaderBarStyle,
  type THeaderSubmenuStyle,
} from '@blog/config';
import { toOptions } from '@blog/utils/primitives';
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

  const layoutOptions = toOptions(HEADER_LAYOUT, (layout) =>
    t(`headerLayoutOptionLabel.${layout}`),
  );
  const submenuStyleOptions = toOptions(HEADER_SUBMENU_STYLE, (style) =>
    t(`headerSubmenuStyleOptionLabel.${style}`),
  );
  const barStyleOptions = toOptions(HEADER_BAR_STYLE, (style) =>
    t(`headerBarStyleOptionLabel.${style}`),
  );

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
          aria={{ describedBy: layoutLock.describedBy }}
          options={layoutOptions}
          value={headerLayout}
          onChange={(layout) => updateField('headerLayout', layout)}
          isDisabled={layoutLock.isDisabled}
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
            aria={{ describedBy: submenuStyleLock.describedBy }}
            options={submenuStyleOptions}
            value={headerSubmenuStyle}
            onChange={(style) => {
              updateField('headerSubmenuStyle', style);
              markChanged();
            }}
            isDisabled={submenuStyleLock.isDisabled}
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
          aria={{ describedBy: barStyleLock.describedBy }}
          options={barStyleOptions}
          value={headerBarStyle}
          onChange={(style) => updateField('headerBarStyle', style)}
          isDisabled={barStyleLock.isDisabled}
        />
      </LookField>

      <AccountFields />
    </LookCard>
  );
};
