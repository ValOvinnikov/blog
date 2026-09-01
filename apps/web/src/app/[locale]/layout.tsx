import { getEnabledOAuthProviderIds } from '@blog/auth';
import { ICONS, type ILocalizedParams, routes, SIZE } from '@blog/config';
import { service } from '@blog/service';
import { Icon } from '@blog/ui/atoms/icon';
import { NavLink } from '@blog/ui/atoms/nav-link';
import { Footer } from '@blog/ui/organisms/footer';
import { Header } from '@blog/ui/organisms/header';
import { AuthMenu } from '@web/components/shared/auth-menu';
import { BrandLockupLink } from '@web/components/shared/brand-lockup-link';
import { SiteNavigation } from '@web/components/shared/site-navigation';
import { SmartLink } from '@web/components/shared/smart-link';
import { ThemeToggleButton } from '@web/components/shared/theme-toggle-button';
import { ToastProvider } from '@web/context/toast-provider';
import { routing } from '@web/i18n/routing';
import { env } from '@web/utils/env/env';
import { getChromeOn } from '@web/utils/get-chrome-on';
import { isProductionEnvironment } from '@web/utils/is-production-environment';
import { logger } from '@web/utils/logger/logger';
import { toSocialIconName } from '@web/utils/to-social-icon-name';
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

export async function generateMetadata(): Promise<Metadata> {
  const result = await service.global.siteSettings.v1.getSiteSettings();

  // Every route's own `openGraph`/`twitter` replaces (not merges with) this
  // root segment's — `metadataBase` is the one field that still inherits
  // down (see `toMetadata`), which is what lets a leaf's relative fallback
  // image path resolve to an absolute URL.
  const metadataBase = env.NEXT_PUBLIC_SITE_URL
    ? new URL(env.NEXT_PUBLIC_SITE_URL)
    : undefined;

  // Only the real production environment is indexable — see
  // `isProductionEnvironment` and `robots.ts` for the full reasoning. This
  // page-level meta tag is the primary de-indexing lever (unlike a robots.txt
  // disallow, it survives a crawl and gets honored by the crawler), so it's
  // applied here at the root layout, ahead of the `!result.ok` guard, so it
  // still lands even when site settings fail to load. Spread conditionally
  // rather than assigning `robots: undefined` on production, keeping the key
  // absent (not just falsy) when indexing is allowed.
  const robotsMetadata = isProductionEnvironment()
    ? {}
    : { robots: { index: false, follow: false } };

  if (!result.ok) {
    logger.error('site_settings.metadata_fetch_failed', {
      error: result.error,
    });
    return { metadataBase, ...robotsMetadata };
  }

  const { brand, description } = result.data;

  return {
    metadataBase,
    title: {
      default: brand.name,
      template: `%s | ${brand.name}`,
    },
    description,
    ...robotsMetadata,
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type TProps = {
  children: React.ReactNode;
  params: Promise<ILocalizedParams>;
};

export default async function LocaleLayout({ children, params }: TProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const [
    settingsResult,
    navResult,
    footerResult,
    chromeOn,
    messages,
    now,
    timeZone,
    t,
  ] = await Promise.all([
    service.global.siteSettings.v1.getSiteSettings(),
    service.global.navigation.v1.getNavigation(),
    service.global.footer.v1.getFooter(),
    getChromeOn(),
    getMessages(),
    getNow(),
    getTimeZone(),
    getTranslations('rss'),
  ]);

  if (!settingsResult.ok) {
    logger.error('site_settings.layout_fetch_failed', {
      error: settingsResult.error,
    });
    notFound();
  }

  const { brand } = settingsResult.data;
  const navItems = navResult.ok ? navResult.data.items : [];
  const social = footerResult.ok ? footerResult.data.social : [];
  const plain = !chromeOn;
  const currentYear = new Date().getFullYear();
  const s = localeLayoutVariants();
  const oauthProviderIds = getEnabledOAuthProviderIds();

  return (
    // `locale`, `now`, and `timeZone` are passed explicitly (not inherited)
    // so the page stays statically rendered — `setRequestLocale` above
    // already resolves them from the static param rather than a dynamic
    // API, but passing them here skips the provider's own implicit
    // resolution. `messages` comes from `getMessages()`, which reads the
    // per-locale `messages/*.json` file wired in `i18n/request.ts`. Client
    // components that read the locale (next-intl navigation `Link` in the
    // post-list module) need this provider or they throw "No intl context
    // found".
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      now={now}
      timeZone={timeZone}
    >
      {/* No `session` prop: `AuthMenu` resolves the session client-side rather than duplicating an `auth()` call at every layout render. */}
      <SessionProvider>
        {/* Mounted above `children` so a toast survives a client-side route change instead of being tied to the page that fired it. */}
        <ToastProvider isPlain={plain}>
          <div className={s.root()}>
            <Header>
              <Header.Brand>
                <BrandLockupLink brand={brand} />
              </Header.Brand>
              <SiteNavigation
                links={navItems}
                actions={
                  <>
                    <ThemeToggleButton />
                    <AuthMenu
                      oauthProviderIds={oauthProviderIds}
                      isPlain={plain}
                    />
                  </>
                }
              />
            </Header>
            <div className={s.content()}>{children}</div>
            <Footer dataTestId="site-footer">
              <Footer.Copyright title={brand.name} year={currentYear} />
              <Footer.Nav>
                {social.map((link) => {
                  // `link.platform` is optional and free-form beyond the
                  // `SOCIAL_PLATFORMS` enum's known icon set — an unmapped
                  // platform falls back to the original label-only rendering
                  // (no `icon`, `hasLabel` stays true) rather than hiding
                  // the link.
                  const iconName =
                    link.platform && toSocialIconName(link.platform);

                  return (
                    <NavLink
                      key={link.href}
                      as={SmartLink}
                      href={link.href}
                      target={link.target}
                      icon={
                        iconName ? (
                          <Icon
                            name={iconName}
                            size={SIZE.SM}
                            dataTestId={`social-icon-${link.platform}`}
                          />
                        ) : undefined
                      }
                      hasLabel={!iconName}
                    >
                      {link.label}
                    </NavLink>
                  );
                })}
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
        </ToastProvider>
      </SessionProvider>
    </NextIntlClientProvider>
  );
}
