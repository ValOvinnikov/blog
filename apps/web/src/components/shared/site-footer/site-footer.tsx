import {
  CAPABILITY,
  COOKIE_SETTINGS_BUTTON,
  FOOTER_FINE_PRINT_KIND,
  ICONS,
  routes,
  SIZE,
} from '@blog/config';
import { service } from '@blog/service';
import { Icon } from '@blog/ui/components/atoms/icon';
import { TextLink } from '@blog/ui/components/atoms/text-link';
import { Footer } from '@blog/ui/components/organisms/footer';
import { hasArrayGotItems } from '@blog/utils/primitives';
import { BrandLockupLink } from '@web/components/shared/brand-lockup-link';
import { CookieSettingsButton } from '@web/components/shared/cookie-settings-button';
import { FloatingCookieSettingsButton } from '@web/components/shared/floating-cookie-settings-button';
import { LanguageSwitcher } from '@web/components/shared/language-switcher';
import { SmartLink } from '@web/components/shared/smart-link';
import { SocialLinks } from '@web/components/shared/social-links';
import { FOOTER_LOG } from '@web/constants/footer';
import { routing } from '@web/i18n/routing';
import { getRequestContext } from '@web/server/request-context/request-context';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import { getBrandLogoUrl } from '@web/server/site-config/get-brand-logo-url/get-brand-logo-url';
import { getFooterStyle } from '@web/server/site-config/get-footer-style/get-footer-style';
import { getLanguageSwitcherStyle } from '@web/server/site-config/get-language-switcher-style/get-language-switcher-style';
import { getSiteSettings } from '@web/server/site-settings/get-site-settings/get-site-settings';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
import { arrangeFooterLinks } from '@web/utils/arrange-footer-links';
import { logger } from '@web/utils/logger/logger';
import { getTranslations } from 'next-intl/server';

import { FooterLink } from './components/footer-link/footer-link';

export const SiteFooter = async () => {
  const { tenantId, sanityContext, locale, defaultLocale, liveLocales } =
    await getRequestContext();
  const tenant = tenantId ?? UNRESOLVED_TENANT_PLACEHOLDER;
  const [
    settingsResult,
    footerResult,
    tRss,
    t,
    switcherStyle,
    footerStyle,
    brandLogoUrl,
    isConsentBannerEnabled,
  ] = await Promise.all([
    getSiteSettings(),
    service.global.footer.v1.getFooter(sanityContext),
    getTranslations('rss'),
    getTranslations('siteFooter'),
    getLanguageSwitcherStyle(tenant),
    getFooterStyle(tenant),
    getBrandLogoUrl(tenant),
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
  const footer = footerResult.ok ? footerResult.data : undefined;
  const social = footer?.social ?? [];
  const hasLanguageSwitcher = footer?.showLanguageSwitcher === true;
  const hasRssFeed = footer?.showRssFeed ?? true;
  const { groups, finePrint } = arrangeFooterLinks({
    groups: footer?.groups ?? [],
    finePrint: footer?.finePrint ?? [],
  });
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
        <Footer.Logo>
          {brandLogoUrl && <BrandLockupLink logoUrl={brandLogoUrl} />}
        </Footer.Logo>
        <Footer.About>{footer?.about}</Footer.About>
        <Footer.Address>{footer?.address}</Footer.Address>
        {hasArrayGotItems(social) && (
          <Footer.Social>
            <SocialLinks profiles={social} />
          </Footer.Social>
        )}
        <Footer.Groups ariaLabel={t('groupsAriaLabel')}>
          {groups.map(({ heading, links }, index) => (
            <Footer.Group
              key={`${index}-${heading}`}
              heading={heading}
              headingLevel={2}
            >
              {links.map((link) => (
                <Footer.GroupItem key={link.href}>
                  <FooterLink link={link} />
                </Footer.GroupItem>
              ))}
            </Footer.Group>
          ))}
        </Footer.Groups>
        <Footer.Wordmark>{brand.name}</Footer.Wordmark>
        <Footer.Copyright title={brand.name} year={new Date().getFullYear()} />
        <Footer.FinePrint ariaLabel={t('finePrintAriaLabel')}>
          {finePrint.map((item) =>
            item.kind === FOOTER_FINE_PRINT_KIND.LINK ? (
              <FooterLink key={item.link.href} link={item.link} />
            ) : (
              <CookieSettingsButton key={item.kind} />
            ),
          )}
        </Footer.FinePrint>
        <Footer.Nav>
          {hasLanguageSwitcher && (
            <LanguageSwitcher
              liveLocales={liveLocales ?? [locale]}
              currentLocale={locale}
              defaultLocale={defaultLocale ?? routing.defaultLocale}
              switcherStyle={switcherStyle}
              isInFooter={true}
            />
          )}
          {hasRssFeed && (
            <TextLink
              appearance="nav"
              as={SmartLink}
              href={routes.rssFeed()}
              ariaLabel={tRss('feedLinkLabel')}
              title={tRss('feedLinkLabel')}
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
