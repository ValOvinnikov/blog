import {
  CAPABILITY,
  COOKIE_SETTINGS_BUTTON,
  ICONS,
  routes,
  SIZE,
} from '@blog/config';
import { service } from '@blog/service';
import { Icon } from '@blog/ui/components/atoms/icon';
import { TextLink } from '@blog/ui/components/atoms/text-link';
import { Footer } from '@blog/ui/components/organisms/footer';
import { CookieSettingsButton } from '@web/components/shared/cookie-settings-button';
import { FloatingCookieSettingsButton } from '@web/components/shared/floating-cookie-settings-button';
import { LanguageSwitcher } from '@web/components/shared/language-switcher';
import { SmartLink } from '@web/components/shared/smart-link';
import { SocialLinks } from '@web/components/shared/social-links';
import { FOOTER_LOG } from '@web/constants/footer';
import { routing } from '@web/i18n/routing';
import { getRequestContext } from '@web/server/request-context/request-context';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import { getFooterStyle } from '@web/server/site-config/get-footer-style/get-footer-style';
import { getLanguageSwitcherStyle } from '@web/server/site-config/get-language-switcher-style/get-language-switcher-style';
import { getSiteSettings } from '@web/server/site-settings/get-site-settings/get-site-settings';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
import { logger } from '@web/utils/logger/logger';
import { getTranslations } from 'next-intl/server';

export const SiteFooter = async () => {
  const { tenantId, sanityContext, locale, defaultLocale, liveLocales } =
    await getRequestContext();
  const tenant = tenantId ?? UNRESOLVED_TENANT_PLACEHOLDER;
  const [
    settingsResult,
    footerResult,
    t,
    switcherStyle,
    footerStyle,
    isConsentBannerEnabled,
  ] = await Promise.all([
    getSiteSettings(),
    service.global.footer.v1.getFooter(sanityContext),
    getTranslations('rss'),
    getLanguageSwitcherStyle(tenant),
    getFooterStyle(tenant),
    isCapabilityEnabled(CAPABILITY.CONSENT_BANNER),
  ]);

  if (!settingsResult.ok) {
    return null;
  }
  if (!footerResult.ok) {
    logger.error(FOOTER_LOG.CONTENT_FETCH_FAILED, {
      error: footerResult.error,
    });
  }

  const { brand } = settingsResult.data;
  const social = footerResult.ok ? footerResult.data.social : [];
  const hasLanguageSwitcher =
    footerResult.ok && footerResult.data.showLanguageSwitcher === true;
  const hasRssFeed = !footerResult.ok || footerResult.data.showRssFeed;
  const { layout, background, surface, cookieSettingsButton } = footerStyle;
  const hasFloatingCookieSettings =
    isConsentBannerEnabled &&
    cookieSettingsButton === COOKIE_SETTINGS_BUTTON.SHOWN;

  return (
    <>
      <Footer
        layout={layout}
        tone={background}
        surface={surface}
        dataTestId="site-footer"
      >
        <Footer.Wordmark>{brand.name}</Footer.Wordmark>
        <Footer.Copyright title={brand.name} year={new Date().getFullYear()} />
        <Footer.Nav>
          <SocialLinks profiles={social} />
          {hasLanguageSwitcher && (
            <LanguageSwitcher
              liveLocales={liveLocales ?? [locale]}
              currentLocale={locale}
              defaultLocale={defaultLocale ?? routing.defaultLocale}
              switcherStyle={switcherStyle}
              isInFooter={true}
            />
          )}
          <CookieSettingsButton />
          {hasRssFeed && (
            <TextLink
              appearance="nav"
              as={SmartLink}
              href={routes.rssFeed()}
              ariaLabel={t('feedLinkLabel')}
              title={t('feedLinkLabel')}
            >
              <Icon name={ICONS.RSS} size={SIZE.SM} dataTestId="rss-icon" />
            </TextLink>
          )}
        </Footer.Nav>
      </Footer>
      {hasFloatingCookieSettings && <FloatingCookieSettingsButton />}
    </>
  );
};
