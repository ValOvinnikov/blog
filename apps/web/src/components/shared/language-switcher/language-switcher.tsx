'use client';

import {
  LOCALE_BCP47_TAGS,
  LOCALE_NATIVE_LABEL,
  type TLocaleIsoCode,
} from '@blog/config';
import { NavLink } from '@blog/ui/components/atoms/nav-link';
import { usePathname } from '@web/i18n/navigation';
import { rememberLanguage } from '@web/utils/language-cookie/language-cookie';
import { toLanguageSwitcherLink } from '@web/utils/to-language-switcher-link/to-language-switcher-link';
import { useTranslations } from 'next-intl';

import { languageSwitcherVariants } from './language-switcher-variants';

type TLanguageSwitcherProps = {
  liveLocales: readonly TLocaleIsoCode[];
  currentLocale: TLocaleIsoCode;
  defaultLocale: TLocaleIsoCode;
  dataTestId?: string;
};

export const LanguageSwitcher = ({
  liveLocales,
  currentLocale,
  defaultLocale,
  dataTestId,
}: TLanguageSwitcherProps) => {
  const t = useTranslations('languageSwitcher');
  const pathname = usePathname();

  if (liveLocales.length < 2) {
    return null;
  }

  const { list } = languageSwitcherVariants();

  return (
    <nav aria-label={t('ariaLabel')} data-testid={dataTestId}>
      <ul className={list()}>
        {liveLocales.map((locale) => {
          const { href, hrefLocale } = toLanguageSwitcherLink({
            locale,
            currentLocale,
            defaultLocale,
            pathname,
          });

          return (
            <li key={locale}>
              <NavLink
                href={href}
                lang={LOCALE_BCP47_TAGS[locale]}
                hrefLang={LOCALE_BCP47_TAGS[hrefLocale]}
                isActive={locale === currentLocale}
                onClick={() => rememberLanguage(locale)}
              >
                {LOCALE_NATIVE_LABEL[locale]}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
