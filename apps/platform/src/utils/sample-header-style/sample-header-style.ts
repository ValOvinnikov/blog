import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import type {
  IAccountControl,
  IHeaderStyle,
  TLanguageSwitcherStyle,
} from '@shinefold/config';

export type TSampleHeaderStyle = IHeaderStyle & {
  languageSwitcherStyle: TLanguageSwitcherStyle;
  account: IAccountControl;
};

export const toSampleHeaderStyle = ({
  headerLayout,
  headerSubmenuStyle,
  headerBarStyle,
  languageSwitcherStyle,
  accountButtonStyle,
  accountPanelStyle,
  accountPhonePlacement,
}: Pick<
  TLookFormValues,
  | 'headerLayout'
  | 'headerSubmenuStyle'
  | 'headerBarStyle'
  | 'languageSwitcherStyle'
  | 'accountButtonStyle'
  | 'accountPanelStyle'
  | 'accountPhonePlacement'
>): TSampleHeaderStyle => ({
  layout: headerLayout,
  submenuStyle: headerSubmenuStyle,
  barStyle: headerBarStyle,
  languageSwitcherStyle,
  account: {
    buttonStyle: accountButtonStyle,
    panelStyle: accountPanelStyle,
    phonePlacement: accountPhonePlacement,
  },
});
