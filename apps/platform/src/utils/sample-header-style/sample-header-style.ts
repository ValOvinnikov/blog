import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import {
  COLOR_MODE,
  type IAccountControl,
  type IHeaderStyle,
  type TBrandVariant,
  type TLanguageSwitcherStyle,
} from '@shinefold/config';

export type TSampleHeaderStyle = IHeaderStyle & {
  breadcrumbBackground: TBrandVariant;
  languageSwitcherStyle: TLanguageSwitcherStyle;
  account: IAccountControl;
  hasThemeToggle: boolean;
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
  colorMode,
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
  | 'colorMode'
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
  hasThemeToggle: colorMode === COLOR_MODE.READER,
});
