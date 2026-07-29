import { ICONS, Size, type IWithDataTestId } from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';
import { IconButton } from '@blog/ui/atoms/icon-button';

import { themeTogglePlaceholderVariants } from './theme-toggle-variants';

export interface IThemeToggleProps extends IWithDataTestId {
  className?: string;
  isDark: boolean;
  onToggle: () => void;
  mounted?: boolean;
  lightLabel?: string;
  darkLabel?: string;
}

/**
 * A pure, controlled theme-switch button. The consumer owns the actual theme
 * state (e.g. reading/writing `document.documentElement` and `localStorage`
 * in `apps/web`) and passes it down via `isDark`/`onToggle`. Renders a
 * placeholder while `mounted` is `false` to avoid a hydration-mismatch flash
 * before the consumer knows the real theme.
 */
export const ThemeToggle = ({
  className,
  dataTestId,
  isDark,
  onToggle,
  mounted = true,
  lightLabel = 'Switch to light theme',
  darkLabel = 'Switch to dark theme',
}: IThemeToggleProps) => {
  const label = isDark ? lightLabel : darkLabel;

  return (
    <IconButton
      ariaLabel={label}
      title={label}
      onClick={onToggle}
      dataTestId={dataTestId}
      className={className}
    >
      {mounted ? (
        isDark ? (
          <Icon name={ICONS.SUN} size={Size.MD} />
        ) : (
          <Icon name={ICONS.MOON} size={Size.MD} />
        )
      ) : (
        <span className={themeTogglePlaceholderVariants()} aria-hidden="true" />
      )}
    </IconButton>
  );
};
