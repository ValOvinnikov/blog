import {
  ICONS,
  SIZE,
  type IAccountControl,
  type TLanguageSwitcherStyle,
  type TLocaleIsoCode,
} from '@blog/config';
import type { IWithClassName } from '@blog/config/types';
import { Icon } from '@blog/ui/components/atoms/icon';
import { IconButton } from '@blog/ui/components/atoms/icon-button';
import { ThemeToggle } from '@blog/ui/components/atoms/theme-toggle';
import { SampleAccountControl } from '@platform/components/features/site-preview/sample-site-header/components/sample-header-controls/components/sample-account-control/sample-account-control';
import { SampleLanguageSwitcher } from '@platform/components/features/site-preview/sample-site-header/components/sample-header-controls/components/sample-language-switcher/sample-language-switcher';
import { useTranslations } from 'next-intl';

import { sampleHeaderControlsVariants } from './sample-header-controls-variants';

export type TSampleHeaderControlsProps = IWithClassName & {
  liveLocales: readonly TLocaleIsoCode[];
  languageSwitcherStyle: TLanguageSwitcherStyle;
  account: IAccountControl;
  hasReaderAccounts: boolean;
  isSignedIn: boolean;
  isDark: boolean;
  isNarrow: boolean;
  hasMenuButton: boolean;
};

export const SampleHeaderControls = ({
  liveLocales,
  languageSwitcherStyle,
  account,
  hasReaderAccounts,
  isSignedIn,
  isDark,
  isNarrow,
  hasMenuButton,
  className,
}: TSampleHeaderControlsProps) => {
  const t = useTranslations('lookPreview');
  const { root, themeToggle } = sampleHeaderControlsVariants();
  const menuLabel = t('menuButton');

  return (
    <div className={root({ class: className })}>
      {!isNarrow && (
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
        </>
      )}
      {hasReaderAccounts && (
        <SampleAccountControl
          account={account}
          isSignedIn={isSignedIn}
          isNarrow={isNarrow}
        />
      )}
      {hasMenuButton && (
        <IconButton variant="circle" ariaLabel={menuLabel} title={menuLabel}>
          <Icon name={ICONS.MENU} size={SIZE.MD} />
        </IconButton>
      )}
    </div>
  );
};
