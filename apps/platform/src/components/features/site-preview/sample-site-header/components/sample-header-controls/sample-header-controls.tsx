import { HEADER_LAYOUT, ICONS, SIZE, type TLocaleIsoCode } from '@blog/config';
import type { IWithClassName } from '@blog/config/types';
import { Icon } from '@blog/ui/components/atoms/icon';
import { IconButton } from '@blog/ui/components/atoms/icon-button';
import { ThemeToggle } from '@blog/ui/components/atoms/theme-toggle';
import { SampleAccountControl } from '@platform/components/features/site-preview/sample-site-header/components/sample-header-controls/components/sample-account-control/sample-account-control';
import { SampleLanguageSwitcher } from '@platform/components/features/site-preview/sample-site-header/components/sample-header-controls/components/sample-language-switcher/sample-language-switcher';
import type { TSampleHeaderStyle } from '@platform/utils/sample-header-style/sample-header-style';
import { useTranslations } from 'next-intl';

import { sampleHeaderControlsVariants } from './sample-header-controls-variants';

export type TSampleHeaderControlsProps = IWithClassName & {
  liveLocales: readonly TLocaleIsoCode[];
  header: TSampleHeaderStyle;
  hasReaderAccounts: boolean;
  isSignedIn: boolean;
  isDark: boolean;
  shouldAlwaysShowLanguageSwitcher: boolean;
};

export const SampleHeaderControls = ({
  liveLocales,
  header: { layout, languageSwitcherStyle, account },
  hasReaderAccounts,
  isSignedIn,
  isDark,
  shouldAlwaysShowLanguageSwitcher,
  className,
}: TSampleHeaderControlsProps) => {
  const t = useTranslations('lookPreview');
  const { root, themeToggle } = sampleHeaderControlsVariants();
  const menuLabel = t('menuButton');

  return (
    <div className={root({ class: className })}>
      <SampleLanguageSwitcher
        liveLocales={liveLocales}
        switcherStyle={languageSwitcherStyle}
        isAlwaysShown={shouldAlwaysShowLanguageSwitcher}
      />
      <ThemeToggle
        isDark={isDark}
        onToggle={() => undefined}
        lightLabel={t('themeToggleLight')}
        darkLabel={t('themeToggleDark')}
        className={themeToggle()}
      />
      {hasReaderAccounts && (
        <SampleAccountControl
          account={account}
          appearance={account.buttonStyle}
          isSignedIn={isSignedIn}
        />
      )}
      {layout === HEADER_LAYOUT.MENU_BUTTON && (
        <IconButton variant="circle" ariaLabel={menuLabel} title={menuLabel}>
          <Icon name={ICONS.MENU} size={SIZE.MD} />
        </IconButton>
      )}
    </div>
  );
};
