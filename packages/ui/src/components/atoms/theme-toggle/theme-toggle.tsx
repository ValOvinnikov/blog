import {
  ICONS,
  SIZE,
  type IWithClassName,
  type IWithDataTestId,
} from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';
import { IconButton } from '@blog/ui/components/atoms/icon-button';

import { themeToggleVariants } from './theme-toggle-variants';

export type TThemeToggleProps = IWithClassName &
  IWithDataTestId & {
    isDark: boolean;
    onToggle: () => void;
    isIconFromThemeClass?: boolean;
    lightLabel?: string;
    darkLabel?: string;
  };

/** A pure, controlled theme-switch button. */
export const ThemeToggle = ({
  className,
  dataTestId,
  isDark,
  onToggle,
  isIconFromThemeClass = false,
  lightLabel = 'Switch to light theme',
  darkLabel = 'Switch to dark theme',
}: TThemeToggleProps) => {
  const label = isDark ? lightLabel : darkLabel;
  const { sun, moon } = themeToggleVariants({ isIconFromThemeClass });

  return (
    <IconButton
      ariaLabel={label}
      title={label}
      onClick={onToggle}
      dataTestId={dataTestId}
      className={className}
    >
      {(isIconFromThemeClass || isDark) && (
        <Icon
          name={ICONS.SUN}
          size={SIZE.MD}
          className={sun()}
          dataTestId="theme-toggle-sun"
        />
      )}
      {(isIconFromThemeClass || !isDark) && (
        <Icon
          name={ICONS.MOON}
          size={SIZE.MD}
          className={moon()}
          dataTestId="theme-toggle-moon"
        />
      )}
    </IconButton>
  );
};
