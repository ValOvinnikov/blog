import { getEnabledOAuthProviderIds } from '@blog/auth/utils/oauth-providers/oauth-providers';
import { service, urlForSanityImage } from '@blog/service';
import { Header } from '@blog/ui/components/organisms/header';
import { AuthMenu } from '@web/components/shared/auth-menu';
import { BrandLockupLink } from '@web/components/shared/brand-lockup-link';
import { LanguageSwitcher } from '@web/components/shared/language-switcher';
import { SiteNavigation } from '@web/components/shared/site-navigation';
import { ThemeToggleButton } from '@web/components/shared/theme-toggle-button';
import { routing } from '@web/i18n/routing';
import { getRequestContext } from '@web/server/request-context/request-context';
import { isReaderAccountEnabled } from '@web/server/settings-features/is-reader-account-enabled';
import { getLanguageSwitcherStyle } from '@web/server/site-config/get-language-switcher-style';
import { getSiteSettings } from '@web/server/site-settings/get-site-settings';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
import { logger } from '@web/utils/logger/logger';

export const SiteHeader = async () => {
  const { tenantId, sanityContext, locale, defaultLocale, liveLocales } =
    await getRequestContext();
  const [settingsResult, navResult, hasReaderAccounts, switcherStyle] =
    await Promise.all([
      getSiteSettings(),
      service.global.navigation.v1.getNavigation(sanityContext),
      isReaderAccountEnabled(),
      getLanguageSwitcherStyle(tenantId ?? UNRESOLVED_TENANT_PLACEHOLDER),
    ]);

  if (!settingsResult.ok) {
    return null;
  }
  if (!navResult.ok) {
    logger.error('navigation.layout_fetch_failed', {
      error: navResult.error,
    });
  }

  const { brand } = settingsResult.data;
  const navItems = navResult.ok ? navResult.data.items : [];
  const hasLanguageSwitcher =
    navResult.ok && navResult.data.showLanguageSwitcher === true;
  const brandLogoUrl = brand.logo
    ? urlForSanityImage(brand.logo, sanityContext)
    : undefined;

  return (
    <Header>
      <Header.Brand>
        <BrandLockupLink logoUrl={brandLogoUrl} tagline={brand.tagline} />
      </Header.Brand>
      <SiteNavigation
        links={navItems}
        panelActions={
          hasLanguageSwitcher && (
            <>
              <LanguageSwitcher
                liveLocales={liveLocales ?? [locale]}
                currentLocale={locale}
                defaultLocale={defaultLocale ?? routing.defaultLocale}
                switcherStyle={switcherStyle}
              />
              <ThemeToggleButton />
            </>
          )
        }
        actions={
          <>
            {!hasLanguageSwitcher && <ThemeToggleButton />}
            {hasReaderAccounts && (
              <AuthMenu oauthProviderIds={getEnabledOAuthProviderIds()} />
            )}
          </>
        }
      />
    </Header>
  );
};
