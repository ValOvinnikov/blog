import {
  ICONS,
  SIZE,
  type TLanguageSwitcherStyle,
  type TLocaleIsoCode,
} from '@blog/config';
import type { IWithClassName } from '@blog/config/types';
import { Icon } from '@blog/ui/components/atoms/icon';
import { IconButton } from '@blog/ui/components/atoms/icon-button';
import { ThemeToggle } from '@blog/ui/components/atoms/theme-toggle';
import { SampleLanguageSwitcher } from '@platform/components/features/site-preview/look-sample/components/sample-language-switcher';
import { useTranslations } from 'next-intl';

import { sampleHeaderControlsVariants } from './sample-header-controls-variants';

export type TSampleHeaderControlsProps = IWithClassName & {
  liveLocales: readonly TLocaleIsoCode[];
  languageSwitcherStyle: TLanguageSwitcherStyle;
  hasReaderAccounts: boolean;
  isDark: boolean;
  isNarrow: boolean;
  hasMenuButton: boolean;
};

export const SampleHeaderControls = ({
  liveLocales,
  languageSwitcherStyle,
  hasReaderAccounts,
  isDark,
  isNarrow,
  hasMenuButton,
  className,
}: TSampleHeaderControlsProps) => {
  const t = useTranslations('lookPreview');
  const { root, themeToggle, signIn, signInGlyph } =
    sampleHeaderControlsVariants();
  const signInLabel = t('signIn');
  const menuLabel = t('menuButton');

  return (
    <div className={root({ class: className })}>
      {isNarrow ? (
        hasReaderAccounts && (
          <IconButton
            variant="circle"
            ariaLabel={signInLabel}
            title={signInLabel}
          >
            <Icon name={ICONS.USER} size={SIZE.MD} />
          </IconButton>
        )
      ) : (
        <>
          <SampleLanguageSwitcher
            liveLocales={liveLocales}
            switcherStyle={languageSwitcherStyle}
          />
          <ThemeToggle
            isDark={isDark}
            onToggle={() => undefined}
            lightLabel={t('themeToggleLight')}
            darkLabel={t('themeToggleDark')}
            className={themeToggle()}
          />
          {hasReaderAccounts && (
            <IconButton
              variant="bordered"
              ariaLabel={signInLabel}
              className={signIn()}
            >
              <Icon
                name={ICONS.USER}
                size={SIZE.SM}
                className={signInGlyph()}
              />
              {signInLabel}
            </IconButton>
          )}
        </>
      )}
      {hasMenuButton && (
        <IconButton variant="circle" ariaLabel={menuLabel} title={menuLabel}>
          <Icon name={ICONS.MENU} size={SIZE.MD} />
        </IconButton>
      )}
    </div>
  );
};
