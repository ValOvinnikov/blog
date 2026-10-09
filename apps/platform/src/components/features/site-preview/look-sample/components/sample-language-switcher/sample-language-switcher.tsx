import {
  ICONS,
  LANGUAGE_SWITCHER_STYLE,
  LOCALE_BCP47_TAGS,
  LOCALE_NATIVE_LABEL,
  SIZE,
  type TLanguageSwitcherStyle,
  type TLocaleIsoCode,
} from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';
import { NavLink } from '@blog/ui/components/atoms/nav-link';
import { PopoverMenu } from '@blog/ui/components/molecules/popover-menu';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { sampleLanguageSwitcherVariants } from './sample-language-switcher-variants';

// Matches apps/web's LanguageSwitcher, which falls back to MENU_CODE above it.
const MAX_COMPACT_CODES = 4;

const toCode = (locale: TLocaleIsoCode) =>
  LOCALE_BCP47_TAGS[locale].toUpperCase();

export type TSampleLanguageSwitcherProps = {
  liveLocales: readonly TLocaleIsoCode[];
  switcherStyle: TLanguageSwitcherStyle;
};

export const SampleLanguageSwitcher = ({
  liveLocales,
  switcherStyle,
}: TSampleLanguageSwitcherProps) => {
  const t = useTranslations('lookPreview');
  const panelId = useId();
  const [currentLocale] = liveLocales;

  if (!currentLocale || liveLocales.length < 2) {
    return null;
  }

  const resolvedStyle =
    switcherStyle === LANGUAGE_SWITCHER_STYLE.CODES &&
    liveLocales.length > MAX_COMPACT_CODES
      ? LANGUAGE_SWITCHER_STYLE.MENU_CODE
      : switcherStyle;
  const hasGlobe = resolvedStyle === LANGUAGE_SWITCHER_STYLE.MENU_GLOBE;
  const { codeList, codeLink, trigger, caret } = sampleLanguageSwitcherVariants(
    { hasGlobe },
  );

  if (resolvedStyle === LANGUAGE_SWITCHER_STYLE.CODES) {
    return (
      <ul className={codeList()}>
        {liveLocales.map((locale) => (
          <li key={locale}>
            <NavLink
              href="#"
              lang={LOCALE_BCP47_TAGS[locale]}
              aria-label={LOCALE_NATIVE_LABEL[locale]}
              isActive={locale === currentLocale}
              className={codeLink()}
            >
              {toCode(locale)}
            </NavLink>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <PopoverMenu>
      <PopoverMenu.Trigger
        ariaLabel={t('switcherMenuAriaLabel', {
          language: LOCALE_NATIVE_LABEL[currentLocale],
        })}
        isOpen={false}
        panelId={panelId}
        variant="bordered"
        className={trigger()}
      >
        {hasGlobe ? (
          <Icon name={ICONS.GLOBE} size={SIZE.SM} />
        ) : (
          <>
            {toCode(currentLocale)}
            <Icon name={ICONS.CHEVRON_DOWN} className={caret()} />
          </>
        )}
      </PopoverMenu.Trigger>
      <PopoverMenu.Panel id={panelId} isOpen={false} />
    </PopoverMenu>
  );
};
