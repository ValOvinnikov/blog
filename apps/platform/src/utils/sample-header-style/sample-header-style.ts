import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import type {
  IAccountControl,
  IHeaderStyle,
  TBrandVariant,
  TLanguageSwitcherStyle,
} from '@shinefold/config';

export type TSampleHeaderStyle = IHeaderStyle & {
  breadcrumbBackground: TBrandVariant;
  languageSwitcherStyle: TLanguageSwitcherStyle;
  account: IAccountControl;
};

export const toSampleHeaderStyle = ({
  headerLayout,
  headerSubmenuStyle,
  headerBarStyle,
  headerBackground,
  breadcrumbBackground,
  languageSwitcherStyle,
  accountButtonStyle,
  accountPanelStyle,
  accountPhonePlacement,
}: Pick<
  TLookFormValues,
  | 'headerLayout'
  | 'headerSubmenuStyle'
  | 'headerBarStyle'
  | 'headerBackground'
  | 'breadcrumbBackground'
  | 'languageSwitcherStyle'
  | 'accountButtonStyle'
  | 'accountPanelStyle'
  | 'accountPhonePlacement'
>): TSampleHeaderStyle => ({
  layout: headerLayout,
  submenuStyle: headerSubmenuStyle,
  barStyle: headerBarStyle,
  background: headerBackground,
  breadcrumbBackground,
  languageSwitcherStyle,
  account: {
    buttonStyle: accountButtonStyle,
    panelStyle: accountPanelStyle,
    phonePlacement: accountPhonePlacement,
  },
});
