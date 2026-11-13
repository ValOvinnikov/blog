import { CAPABILITY, FOOTER_FINE_PRINT_KIND } from '@blog/config';
import { service } from '@blog/service';
import { Footer } from '@blog/ui/components/organisms/footer';
import { hasArrayGotItems, isString } from '@blog/utils/primitives';
import { BrandLockupLink } from '@web/components/shared/brand-lockup-link';
import { CookieSettingsButton } from '@web/components/shared/cookie-settings-button';
import { FloatingCookieSettingsButton } from '@web/components/shared/floating-cookie-settings-button';
import { LanguageSwitcher } from '@web/components/shared/language-switcher';
import { SocialLinks } from '@web/components/shared/social-links';
import { FOOTER_LOG } from '@web/constants/footer';
import { routing } from '@web/i18n/routing';
import { getRequestContext } from '@web/server/request-context/request-context';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import { getBrandLogoUrl } from '@web/server/site-config/get-brand-logo-url/get-brand-logo-url';
import { getBrandName } from '@web/server/site-config/get-brand-name/get-brand-name';
import { getFooterStyle } from '@web/server/site-config/get-footer-style/get-footer-style';
import { getLanguageSwitcherStyle } from '@web/server/site-config/get-language-switcher-style/get-language-switcher-style';
import { getPoweredByMark } from '@web/server/site-config/get-powered-by-mark/get-powered-by-mark';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
import { arrangeFooterLinks } from '@web/utils/arrange-footer-links';
import { logger } from '@web/utils/logger/logger';
import { resolveCookieSettingsControls } from '@web/utils/resolve-cookie-settings-controls';
import { getTranslations } from 'next-intl/server';

import { FooterLink } from './components/footer-link/footer-link';
import { FooterRssLink } from './components/footer-rss-link/footer-rss-link';

export const SiteFooter = async () => {
  const {
    tenantId,
    tenantName,
    sanityContext,
    locale,
    defaultLocale,
    liveLocales,
  } = await getRequestContext();
  const tenant = tenantId ?? UNRESOLVED_TENANT_PLACEHOLDER;
  const [
    brandName,
    footerResult,
    tRss,
    t,
    switcherStyle,
    footerStyle,
    brandLogoUrl,
    isConsentBannerEnabled,
    poweredByMark,
  ] = await Promise.all([
    getBrandName({ tenantId, tenantName }),
    service.global.footer.v1.getFooter(sanityContext),
    getTranslations('rss'),
    getTranslations('siteFooter'),
    getLanguageSwitcherStyle(tenant),
    getFooterStyle(tenant),
    getBrandLogoUrl(tenant),
    isCapabilityEnabled(CAPABILITY.CONSENT_BANNER),
    getPoweredByMark(tenant),
  ]);

  if (!footerResult.ok) {
    logger.error(FOOTER_LOG.CONTENT_FETCH_FAILED, {
      error: footerResult.error,
    });
  }

  const footer = footerResult.ok ? footerResult.data : undefined;
  const social = footer?.social ?? [];
  const hasLanguageSwitcher = footer?.showLanguageSwitcher === true;
  const hasRssFeed = footer?.showRssFeed ?? true;
  const copyrightName = footer?.copyrightName ?? brandName;
  const { layout, background, surface, cookieSettingsButton } = footerStyle;
  const { hasCookieSettingsLink, hasCookieSettingsButton } =
    resolveCookieSettingsControls(cookieSettingsButton, isConsentBannerEnabled);
  const { groups, finePrint } = arrangeFooterLinks({
    groups: footer?.groups ?? [],
    finePrint: footer?.finePrint ?? [],
    hasCookieSettingsLink,
  });

  return (
    <>
      <Footer
        layout={layout}
        tone={background}
        surface={surface}
        dataTestId="site-footer"
      >
        <Footer.Logo>
          {brandLogoUrl && (
            <BrandLockupLink logoUrl={brandLogoUrl} siteName={brandName} />
          )}
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
        <Footer.Wordmark>{brandName}</Footer.Wordmark>
        {isString(copyrightName) && (
          <Footer.Copyright
            title={copyrightName}
            year={new Date().getFullYear()}
          />
        )}
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
          {hasRssFeed && <FooterRssLink label={tRss('feedLinkLabel')} />}
        </Footer.Nav>
        {poweredByMark && (
          <Footer.PoweredBy
            label={t('poweredByLabel')}
            productName={poweredByMark.productName}
            href={poweredByMark.href}
          />
        )}
      </Footer>
      {hasCookieSettingsButton && <FloatingCookieSettingsButton />}
    </>
  );
};
