import type { IHeaderStyle, TLanguageSwitcherStyle } from '@blog/config';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';

export type TSampleHeaderStyle = IHeaderStyle & {
  languageSwitcherStyle: TLanguageSwitcherStyle;
};

export const toSampleHeaderStyle = ({
  headerLayout,
  headerSubmenuStyle,
  headerBarStyle,
  languageSwitcherStyle,
}: Pick<
  TLookFormValues,
  | 'headerLayout'
  | 'headerSubmenuStyle'
  | 'headerBarStyle'
  | 'languageSwitcherStyle'
>): TSampleHeaderStyle => ({
  layout: headerLayout,
  submenuStyle: headerSubmenuStyle,
  barStyle: headerBarStyle,
  languageSwitcherStyle,
});
