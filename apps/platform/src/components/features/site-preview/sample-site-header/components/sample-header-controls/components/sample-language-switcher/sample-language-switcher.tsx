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
import { TextLink } from '@blog/ui/components/atoms/text-link';
import { PopoverMenu } from '@blog/ui/components/molecules/popover-menu';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { sampleLanguageSwitcherVariants } from './sample-language-switcher-variants';

// Matches apps/web's LanguageSwitcher, which falls back to MENU_CODE above it.
const MAX_COMPACT_CODES = 4;
const MIN_SWITCHABLE_LOCALES = 2;

const toCode = (locale: TLocaleIsoCode) =>
  LOCALE_BCP47_TAGS[locale].toUpperCase();

export type TSampleLanguageSwitcherProps = {
  liveLocales: readonly TLocaleIsoCode[];
  switcherStyle: TLanguageSwitcherStyle;
  isAlwaysShown: boolean;
};

export const SampleLanguageSwitcher = ({
  liveLocales,
  switcherStyle,
  isAlwaysShown,
}: TSampleLanguageSwitcherProps) => {
  const t = useTranslations('lookPreview');
  const panelId = useId();
  const [currentLocale] = liveLocales;

  if (
    !currentLocale ||
    (liveLocales.length < MIN_SWITCHABLE_LOCALES && !isAlwaysShown)
  ) {
    return null;
  }

  const resolvedStyle =
    switcherStyle === LANGUAGE_SWITCHER_STYLE.CODES &&
    liveLocales.length > MAX_COMPACT_CODES
      ? LANGUAGE_SWITCHER_STYLE.MENU_CODE
      : switcherStyle;
  const hasGlobe = resolvedStyle === LANGUAGE_SWITCHER_STYLE.MENU_GLOBE;
  const { codeList, codeLabel, trigger, caret } =
    sampleLanguageSwitcherVariants({ hasGlobe });

  if (resolvedStyle === LANGUAGE_SWITCHER_STYLE.CODES) {
    return (
      <ul className={codeList()}>
        {liveLocales.map((locale) => {
          const isCurrent = locale === currentLocale;
          const { codeLink } = sampleLanguageSwitcherVariants({ isCurrent });

          return (
            <li key={locale}>
              <TextLink
                appearance="nav"
                href={isCurrent ? undefined : '#'}
                lang={LOCALE_BCP47_TAGS[locale]}
                isCurrent={isCurrent}
                className={codeLink()}
                dataTestId={
                  isCurrent ? 'sample-language-code-current' : undefined
                }
              >
                <span aria-hidden="true">{toCode(locale)}</span>
                <span className={codeLabel()}>
                  {LOCALE_NATIVE_LABEL[locale]}
                </span>
              </TextLink>
            </li>
          );
        })}
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
