import { SampleHeaderAction } from '@platform/components/features/site-preview/sample-site-header/components/sample-header-action/sample-header-action';
import { SampleAccountControl } from '@platform/components/features/site-preview/sample-site-header/components/sample-header-controls/components/sample-account-control/sample-account-control';
import { SampleLanguageSwitcher } from '@platform/components/features/site-preview/sample-site-header/components/sample-header-controls/components/sample-language-switcher/sample-language-switcher';
import type { TSampleReader } from '@platform/components/features/site-preview/sample-site-header/sample-reader';
import type { TSampleHeaderStyle } from '@platform/utils/sample-header-style/sample-header-style';
import {
  HEADER_LAYOUT,
  ICONS,
  SIZE,
  type TLocaleIsoCode,
} from '@shinefold/config';
import type { IWithClassName } from '@shinefold/config/types';
import { Icon } from '@shinefold/ui/components/atoms/icon';
import { IconButton } from '@shinefold/ui/components/atoms/icon-button';
import { ThemeToggle } from '@shinefold/ui/components/atoms/theme-toggle';
import { useTranslations } from 'next-intl';

import { sampleHeaderControlsVariants } from './sample-header-controls-variants';

export type TSampleHeaderControlsProps = IWithClassName & {
  liveLocales: readonly TLocaleIsoCode[];
  header: TSampleHeaderStyle;
  reader: TSampleReader;
  isDark: boolean;
  shouldAlwaysShowLanguageSwitcher: boolean;
};

export const SampleHeaderControls = ({
  liveLocales,
  header: { layout, languageSwitcherStyle, account, action, hasThemeToggle },
  reader,
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
      {hasThemeToggle && (
        <ThemeToggle
          isDark={isDark}
          onToggle={() => undefined}
          lightLabel={t('themeToggleLight')}
          darkLabel={t('themeToggleDark')}
          className={themeToggle()}
        />
      )}
      {reader.hasAccounts && (
        <SampleAccountControl
          account={account}
          appearance={account.buttonStyle}
          reader={reader}
        />
      )}
      <SampleHeaderAction actionStyle={action.style} />
      {layout === HEADER_LAYOUT.MENU_BUTTON && (
        <IconButton variant="circle" ariaLabel={menuLabel} title={menuLabel}>
          <Icon name={ICONS.MENU} size={SIZE.MD} />
        </IconButton>
      )}
    </div>
  );
};
