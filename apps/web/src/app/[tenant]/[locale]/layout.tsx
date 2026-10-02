import { getEnabledOAuthProviderIds } from '@blog/auth/utils/oauth-providers/oauth-providers';
import {
  CAPABILITY,
  ICONS,
  type ITenantLocalizedParams,
  LOCALE_BCP47_TAGS,
  routes,
  SIZE,
} from '@blog/config';
import { queries } from '@blog/db';
import {
  getSanityImageBaseUrl,
  service,
  urlForSanityImage,
} from '@blog/service';
import { Icon } from '@blog/ui/components/atoms/icon';
import { NavLink } from '@blog/ui/components/atoms/nav-link';
import { Footer } from '@blog/ui/components/organisms/footer';
import { Header } from '@blog/ui/components/organisms/header';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { AuthMenu } from '@web/components/shared/auth-menu';
import { BrandLockupLink } from '@web/components/shared/brand-lockup-link';
import { DocumentShell } from '@web/components/shared/document-shell';
import { LanguageSwitcher } from '@web/components/shared/language-switcher';
import { SiteNavigation } from '@web/components/shared/site-navigation';
import { SmartLink } from '@web/components/shared/smart-link';
import { SocialLinks } from '@web/components/shared/social-links';
import { ThemeScope } from '@web/components/shared/theme-scope';
import { ThemeToggleButton } from '@web/components/shared/theme-toggle-button';
import { SanityImageBaseUrlProvider } from '@web/context/sanity-image-base-url-provider';
import { ToastProvider } from '@web/context/toast-provider';
import { VoiceRichProvider } from '@web/context/voice-rich-provider';
import { routing } from '@web/i18n/routing';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled';
import { getTenantBaseUrl } from '@web/server/tenant/get-tenant-base-url';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { rememberRequestTenantId } from '@web/server/tenant/remembered-tenant';
import { getThemeTokens } from '@web/utils/get-theme-tokens';
import { isProductionEnvironment } from '@web/utils/is-production-environment';
import { isWebAnalyticsEnabled } from '@web/utils/is-web-analytics-enabled';
import { logger } from '@web/utils/logger/logger';
import { resolveTenantMessages } from '@web/utils/resolve-tenant-messages';
import { resolveVoiceRichFields } from '@web/utils/resolve-voice-rich-fields';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import {
  getMessages,
  getNow,
  getTimeZone,
  getTranslations,
  setRequestLocale,
} from 'next-intl/server';

import { localeLayoutVariants } from './layout-variants';

type TGenerateMetadataProps = {
  params: Promise<ITenantLocalizedParams>;
};

export async function generateMetadata({
  params,
}: TGenerateMetadataProps): Promise<Metadata> {
  const { tenant } = await params;
  const tenantContext = await getTenantSanityContext(tenant);
  const result =
    await service.global.siteSettings.v1.getSiteSettings(tenantContext);

  // `metadataBase` inherits down so a leaf's relative fallback image path resolves.
  const tenantBaseUrl = await getTenantBaseUrl(tenant);
  const metadataBase = tenantBaseUrl ? new URL(tenantBaseUrl) : undefined;

  // Ahead of the `!result.ok` guard so a non-production site stays noindex even when settings fail.
  const robotsMetadata = isProductionEnvironment()
    ? {}
    : { robots: { index: false, follow: false } };

  if (!result.ok) {
    logger.error('site_settings.metadata_fetch_failed', {
      error: result.error,
    });
    return { metadataBase, ...robotsMetadata };
  }

  const { brand } = result.data;

  return {
    metadataBase,
    title: {
      default: brand.name,
      template: `%s | ${brand.name}`,
    },
    ...robotsMetadata,
  };
}

export function generateStaticParams() {
  return [{ locale: routing.defaultLocale }];
}

type TProps = {
  children: React.ReactNode;
  params: Promise<Omit<ITenantLocalizedParams, 'locale'> & { locale: string }>;
};

export default async function LocaleLayout({ children, params }: TProps) {
  const { locale, tenant } = await params;
  rememberRequestTenantId(tenant);

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const tenantContext = await getTenantSanityContext(tenant, locale);
  const [
    settingsResult,
    navResult,
    footerResult,
    themeTokens,
    isAnalyticsCapabilityEnabled,
    baseMessages,
    now,
    timeZone,
    t,
    tenantLocales,
  ] = await Promise.all([
    service.global.siteSettings.v1.getSiteSettings(tenantContext),
    service.global.navigation.v1.getNavigation(tenantContext),
    service.global.footer.v1.getFooter(tenantContext),
    getThemeTokens(tenant),
    isCapabilityEnabled(CAPABILITY.ANALYTICS, tenant),
    getMessages(),
    getNow(),
    getTimeZone(),
    getTranslations('rss'),
    queries.tenants.getTenantLocales(tenant),
  ]);

  if (!settingsResult.ok) {
    logger.error('site_settings.layout_fetch_failed', {
      error: settingsResult.error,
    });
    // Caught by `[tenant]/not-found.tsx`: a same-segment boundary can't catch its own layout.
    notFound();
  }

  const { messages, rich } =
    locale === tenantLocales?.defaultLocale
      ? await resolveTenantMessages(baseMessages, tenant)
      : {
          messages: baseMessages,
          rich: resolveVoiceRichFields({}, baseMessages),
        };
  const { brand } = settingsResult.data;

  if (!navResult.ok) {
    logger.error('navigation.layout_fetch_failed', {
      error: navResult.error,
    });
  }
  const navItems = navResult.ok ? navResult.data.items : [];
  const hasHeaderLanguageSwitcher =
    navResult.ok && navResult.data.showLanguageSwitcher === true;

  if (!footerResult.ok) {
    logger.error('footer.layout_fetch_failed', {
      error: footerResult.error,
    });
  }
  const social = footerResult.ok ? footerResult.data.social : [];
  const hasFooterLanguageSwitcher =
    footerResult.ok && footerResult.data.showLanguageSwitcher === true;
  const defaultLocale = tenantLocales?.defaultLocale ?? routing.defaultLocale;
  const liveLocales = tenantLocales
    ? queries.tenants.selectLiveLocales({
        locale: tenantLocales.defaultLocale,
        additionalLocales: tenantLocales.additionalLocales,
        plan: tenantLocales.plan,
      })
    : [defaultLocale];
  const languageSwitcher = (
    <LanguageSwitcher
      liveLocales={liveLocales}
      currentLocale={locale}
      defaultLocale={defaultLocale}
    />
  );
  const currentYear = new Date().getFullYear();
  const s = localeLayoutVariants();
  const oauthProviderIds = getEnabledOAuthProviderIds();
  const analyticsEnabled =
    isWebAnalyticsEnabled() && isAnalyticsCapabilityEnabled;
  const sanityImageBaseUrl = getSanityImageBaseUrl(tenantContext);
  const brandLogoUrl = brand.logo
    ? urlForSanityImage(brand.logo, tenantContext)
    : undefined;
  return (
    <DocumentShell lang={LOCALE_BCP47_TAGS[locale]}>
      <ThemeScope themeTokens={themeTokens}>
        <SanityImageBaseUrlProvider baseUrl={sanityImageBaseUrl}>
          {/* Passing `locale`, `now` and `timeZone` explicitly keeps the page statically rendered. */}
          <NextIntlClientProvider
            locale={locale}
            messages={messages}
            now={now}
            timeZone={timeZone}
          >
            {/* No `session` prop: `AuthMenu` resolves the session client-side rather than duplicating an `auth()` call at every layout render. */}
            <SessionProvider>
              {/* Mounted above `children` so a toast survives a client-side route change instead of being tied to the page that fired it. */}
              <ToastProvider>
                <VoiceRichProvider values={rich}>
                  <div className={s.root()}>
                    <Header>
                      <Header.Brand>
                        <BrandLockupLink
                          logoUrl={brandLogoUrl}
                          tagline={brand.tagline}
                        />
                      </Header.Brand>
                      <SiteNavigation
                        links={navItems}
                        actions={
                          <>
                            {hasHeaderLanguageSwitcher && languageSwitcher}
                            <ThemeToggleButton />
                            <AuthMenu oauthProviderIds={oauthProviderIds} />
                          </>
                        }
                      />
                    </Header>
                    <div className={s.content()}>{children}</div>
                    <Footer dataTestId="site-footer">
                      <Footer.Copyright title={brand.name} year={currentYear} />
                      <Footer.Nav>
                        <SocialLinks profiles={social} />
                        {hasFooterLanguageSwitcher && languageSwitcher}
                        <NavLink
                          as={SmartLink}
                          href={routes.rssFeed()}
                          icon={
                            <Icon
                              name={ICONS.RSS}
                              size={SIZE.SM}
                              dataTestId="rss-icon"
                            />
                          }
                          hasLabel={false}
                        >
                          {t('feedLinkLabel')}
                        </NavLink>
                      </Footer.Nav>
                    </Footer>
                  </div>
                </VoiceRichProvider>
              </ToastProvider>
            </SessionProvider>
          </NextIntlClientProvider>
        </SanityImageBaseUrlProvider>
        {/* Both scripts 404 unless enabled in the Vercel dashboard. */}
        {analyticsEnabled && <SpeedInsights />}
        {analyticsEnabled && <Analytics />}
      </ThemeScope>
    </DocumentShell>
  );
}
