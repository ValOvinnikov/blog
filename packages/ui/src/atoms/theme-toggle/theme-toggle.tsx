import {
  ICONS,
  SIZE,
  type IWithClassName,
  type IWithDataTestId,
} from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';
import { IconButton } from '@blog/ui/atoms/icon-button';

import { themeTogglePlaceholderVariants } from './theme-toggle-variants';

export type TThemeToggleProps = IWithClassName &
  IWithDataTestId & {
    isDark: boolean;
    onToggle: () => void;
    isMounted?: boolean;
    lightLabel?: string;
    darkLabel?: string;
  };

/** A pure, controlled theme-switch button. */
export const ThemeToggle = ({
  className,
  dataTestId,
  isDark,
  onToggle,
  isMounted = true,
  lightLabel = 'Switch to light theme',
  darkLabel = 'Switch to dark theme',
}: TThemeToggleProps) => {
  const label = isDark ? lightLabel : darkLabel;

  return (
    <IconButton
      ariaLabel={label}
      title={label}
      onClick={onToggle}
      dataTestId={dataTestId}
      className={className}
    >
      {isMounted ? (
        isDark ? (
          <Icon name={ICONS.SUN} size={SIZE.MD} />
        ) : (
          <Icon name={ICONS.MOON} size={SIZE.MD} />
        )
      ) : (
        <span className={themeTogglePlaceholderVariants()} aria-hidden="true" />
      )}
    </IconButton>
  );
};
