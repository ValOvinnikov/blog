import { getEnabledOAuthProviderIds } from '@blog/auth/utils/oauth-providers/oauth-providers';
import { service } from '@blog/service';
import { Header } from '@blog/ui/components/organisms/header';
import { AccountRow, AuthMenu } from '@web/components/shared/auth-menu';
import { BrandLockupLink } from '@web/components/shared/brand-lockup-link';
import { LanguageSwitcher } from '@web/components/shared/language-switcher';
import { SiteNavigation } from '@web/components/shared/site-navigation';
import { ThemeToggleButton } from '@web/components/shared/theme-toggle-button';
import { HeaderOverlayProvider } from '@web/context/header-overlay-provider';
import { routing } from '@web/i18n/routing';
import { getRequestContext } from '@web/server/request-context/request-context';
import { isReaderAccountEnabled } from '@web/server/settings-features/is-reader-account-enabled/is-reader-account-enabled';
import { getBrandLogoUrl } from '@web/server/site-config/get-brand-logo-url/get-brand-logo-url';
import { getLanguageSwitcherStyle } from '@web/server/site-config/get-language-switcher-style/get-language-switcher-style';
import { getSiteSettings } from '@web/server/site-settings/get-site-settings/get-site-settings';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
import { logger } from '@web/utils/logger/logger';

import { StickyHeaderFrame } from './components/sticky-header-frame/sticky-header-frame';

export const SiteHeader = async () => {
  const { tenantId, sanityContext, locale, defaultLocale, liveLocales } =
    await getRequestContext();
  const siteConfigTenant = tenantId ?? UNRESOLVED_TENANT_PLACEHOLDER;
  const [
    settingsResult,
    navResult,
    hasReaderAccounts,
    switcherStyle,
    brandLogoUrl,
  ] = await Promise.all([
    getSiteSettings(),
    service.global.navigation.v1.getNavigation(sanityContext),
    isReaderAccountEnabled(),
    getLanguageSwitcherStyle(siteConfigTenant),
    getBrandLogoUrl(siteConfigTenant),
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

  return (
    <StickyHeaderFrame>
      <HeaderOverlayProvider>
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
            drawerActions={hasReaderAccounts && <AccountRow />}
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
      </HeaderOverlayProvider>
    </StickyHeaderFrame>
  );
};
