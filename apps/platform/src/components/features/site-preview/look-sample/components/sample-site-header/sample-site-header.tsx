import {
  ICONS,
  SIZE,
  type TLanguageSwitcherStyle,
  type TLocaleIsoCode,
  type TMaybeUndefined,
} from '@blog/config';
import { BrandMark } from '@blog/ui/components/atoms/brand-mark';
import { Icon } from '@blog/ui/components/atoms/icon';
import { IconButton } from '@blog/ui/components/atoms/icon-button';
import { TextLink } from '@blog/ui/components/atoms/text-link';
import { ThemeToggle } from '@blog/ui/components/atoms/theme-toggle';
import { SampleLanguageSwitcher } from '@platform/components/features/site-preview/look-sample/components/sample-language-switcher';
import { useTranslations } from 'next-intl';

import { sampleSiteHeaderVariants } from './sample-site-header-variants';

export type TSampleSiteHeaderProps = {
  tenantName: string;
  logoSrc: TMaybeUndefined<string>;
  liveLocales: readonly TLocaleIsoCode[];
  languageSwitcherStyle: TLanguageSwitcherStyle;
  hasReaderAccounts: boolean;
  isNarrow: boolean;
  isDark: boolean;
};

export const SampleSiteHeader = ({
  tenantName,
  logoSrc,
  liveLocales,
  languageSwitcherStyle,
  hasReaderAccounts,
  isNarrow,
  isDark,
}: TSampleSiteHeaderProps) => {
  const t = useTranslations('lookPreview');
  const {
    root,
    brand,
    brandName,
    nav,
    actions,
    themeToggle,
    signIn,
    signInGlyph,
  } = sampleSiteHeaderVariants({ isNarrow });
  const signInLabel = t('signIn');
  const menuLabel = t('menuButton');

  return (
    <header className={root()}>
      <div className={brand()}>
        <BrandMark size={SIZE.SM} title={tenantName} src={logoSrc} />
        <span className={brandName()}>{tenantName}</span>
      </div>
      {isNarrow ? (
        <div className={actions()}>
          {hasReaderAccounts && (
            <IconButton
              variant="circle"
              ariaLabel={signInLabel}
              title={signInLabel}
            >
              <Icon name={ICONS.USER} size={SIZE.MD} />
            </IconButton>
          )}
          <IconButton variant="circle" ariaLabel={menuLabel} title={menuLabel}>
            <Icon name={ICONS.MENU} size={SIZE.MD} />
          </IconButton>
        </div>
      ) : (
        <div className={nav()}>
          <TextLink appearance="nav" href="#" isCurrent={true}>
            {t('navPosts')}
          </TextLink>
          <TextLink appearance="nav" href="#">
            {t('navAbout')}
          </TextLink>
          <div className={actions()}>
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
          </div>
        </div>
      )}
    </header>
  );
};
