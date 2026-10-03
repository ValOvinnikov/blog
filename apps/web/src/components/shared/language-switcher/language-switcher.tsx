'use client';

import {
  LANGUAGE_SWITCHER_STYLE,
  type TLanguageSwitcherStyle,
  type TLocaleIsoCode,
} from '@blog/config';
import { usePathname } from '@web/i18n/navigation';
import { useTranslations } from 'next-intl';

import { LanguageCodes } from './components/language-codes/language-codes';
import { LanguageMenu } from './components/language-menu/language-menu';
import { languageSwitcherVariants } from './language-switcher-variants';
import { toLanguageEntries } from './to-language-entries';

const MAX_COMPACT_CODES = 4;

type TLanguageSwitcherProps = {
  liveLocales: readonly TLocaleIsoCode[];
  currentLocale: TLocaleIsoCode;
  defaultLocale: TLocaleIsoCode;
  switcherStyle: TLanguageSwitcherStyle;
  isInFooter?: boolean;
  dataTestId?: string;
};

export const LanguageSwitcher = ({
  liveLocales,
  currentLocale,
  defaultLocale,
  switcherStyle,
  isInFooter = false,
  dataTestId,
}: TLanguageSwitcherProps) => {
  const t = useTranslations('languageSwitcher');
  const pathname = usePathname();

  if (liveLocales.length < 2) {
    return null;
  }

  const entries = toLanguageEntries({
    liveLocales,
    currentLocale,
    defaultLocale,
    pathname,
  });
  const resolvedStyle =
    switcherStyle === LANGUAGE_SWITCHER_STYLE.CODES &&
    liveLocales.length > MAX_COMPACT_CODES
      ? LANGUAGE_SWITCHER_STYLE.MENU_CODE
      : switcherStyle;
  const control =
    resolvedStyle === LANGUAGE_SWITCHER_STYLE.CODES ? (
      <LanguageCodes entries={entries} isInFooter={isInFooter} />
    ) : (
      <LanguageMenu
        entries={entries}
        menuStyle={resolvedStyle}
        isInFooter={isInFooter}
      />
    );
  const { root, desktopOnly, mobileOnly } = languageSwitcherVariants();

  return (
    <nav
      aria-label={t('ariaLabel')}
      className={root()}
      data-testid={dataTestId}
    >
      {isInFooter || resolvedStyle === LANGUAGE_SWITCHER_STYLE.MENU_CODE ? (
        control
      ) : (
        <>
          <div
            className={desktopOnly()}
            data-testid="language-switcher-desktop"
          >
            {control}
          </div>
          <div className={mobileOnly()} data-testid="language-switcher-mobile">
            <LanguageMenu
              entries={entries}
              menuStyle={LANGUAGE_SWITCHER_STYLE.MENU_CODE}
            />
          </div>
        </>
      )}
    </nav>
  );
};
