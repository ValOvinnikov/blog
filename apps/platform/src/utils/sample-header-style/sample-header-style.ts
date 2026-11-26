import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import {
  COLOR_MODE,
  type IAccountControl,
  type IHeaderStyle,
  type TBrandVariant,
  type THeaderActionPhonePlacement,
  type THeaderActionStyle,
  type TLanguageSwitcherStyle,
} from '@shinefold/config';

export type TSampleHeaderStyle = IHeaderStyle & {
  breadcrumbBackground: TBrandVariant;
  languageSwitcherStyle: TLanguageSwitcherStyle;
  account: IAccountControl;
  action: {
    style: THeaderActionStyle;
    phonePlacement: THeaderActionPhonePlacement;
  };
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
  headerActionStyle,
  headerActionPhonePlacement,
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
  | 'headerActionStyle'
  | 'headerActionPhonePlacement'
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
  action: {
    style: headerActionStyle,
    phonePlacement: headerActionPhonePlacement,
  },
  hasThemeToggle: colorMode === COLOR_MODE.READER,
});
