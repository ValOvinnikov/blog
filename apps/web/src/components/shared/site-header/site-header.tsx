import { getEnabledOAuthProviderIds } from '@blog/auth/utils/oauth-providers/oauth-providers';
import { ACCOUNT_PHONE_PLACEMENT, CAPABILITY } from '@blog/config';
import { service } from '@blog/service';
import { Header } from '@blog/ui/components/organisms/header';
import { BrandLockupLink } from '@web/components/shared/brand-lockup-link';
import { LanguageSwitcher } from '@web/components/shared/language-switcher';
import { SiteNavigation } from '@web/components/shared/site-navigation';
import { ThemeToggleButton } from '@web/components/shared/theme-toggle-button';
import { NAVIGATION_LOG } from '@web/constants/navigation';
import { routing } from '@web/i18n/routing';
import { getSiteOAuthCredentials } from '@web/server/auth/site-oauth-credentials/site-oauth-credentials';
import { getRequestContext } from '@web/server/request-context/request-context';
import {
  isReaderAccountEnabled,
  isReaderAccountFeatureEnabled,
} from '@web/server/settings-features/is-reader-account-enabled/is-reader-account-enabled';
import { getAccountControl } from '@web/server/site-config/get-account-control/get-account-control';
import { getBrandLogoUrl } from '@web/server/site-config/get-brand-logo-url/get-brand-logo-url';
import { getBrandName } from '@web/server/site-config/get-brand-name/get-brand-name';
import { getHeaderStyle } from '@web/server/site-config/get-header-style/get-header-style';
import { getLanguageSwitcherStyle } from '@web/server/site-config/get-language-switcher-style/get-language-switcher-style';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
import { logger } from '@web/utils/logger/logger';

import { AuthMenu } from './components/auth-menu/auth-menu';
import { StickyHeaderFrame } from './components/sticky-header-frame/sticky-header-frame';

export const SiteHeader = async () => {
  const {
    tenantId,
    tenantName,
    sanityContext,
    locale,
    defaultLocale,
    liveLocales,
  } = await getRequestContext();
  const siteConfigTenant = tenantId ?? UNRESOLVED_TENANT_PLACEHOLDER;
  const [
    navResult,
    hasReaderAccounts,
    hasBookmarks,
    switcherStyle,
    brandLogoUrl,
    brandName,
    accountControl,
    headerStyle,
    siteOAuthCredentials,
  ] = await Promise.all([
    service.global.navigation.v1.getNavigation(sanityContext),
    isReaderAccountEnabled(),
    isReaderAccountFeatureEnabled(CAPABILITY.BOOKMARKS),
    getLanguageSwitcherStyle(siteConfigTenant),
    getBrandLogoUrl(siteConfigTenant),
    getBrandName({ tenantId, tenantName }),
    getAccountControl(siteConfigTenant),
    getHeaderStyle(siteConfigTenant),
    getSiteOAuthCredentials(tenantId),
  ]);

  if (!navResult.ok) {
    logger.error(NAVIGATION_LOG.LAYOUT_FETCH_FAILED, {
      error: navResult.error,
    });
  }

  const navItems = navResult.ok ? navResult.data.items : [];
  const tagline = navResult.ok ? navResult.data.tagline : undefined;
  const { layout, submenuStyle, barStyle } = headerStyle;
  const hasLanguageSwitcher =
    navResult.ok && navResult.data.showLanguageSwitcher === true;
  const oauthProviderIds = getEnabledOAuthProviderIds(siteOAuthCredentials);
  const hasAccountInPhoneMenu =
    accountControl.phonePlacement === ACCOUNT_PHONE_PLACEMENT.MENU;

  return (
    <StickyHeaderFrame>
      <Header layout={layout} barStyle={barStyle}>
        <Header.Brand>
          <BrandLockupLink
            logoUrl={brandLogoUrl}
            siteName={brandName}
            tagline={tagline}
          />
        </Header.Brand>
        <SiteNavigation
          links={navItems}
          layout={layout}
          submenuStyle={submenuStyle}
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
          menuAccount={
            hasAccountInPhoneMenu
              ? {
                  oauthProviderIds,
                  panelStyle: accountControl.panelStyle,
                  hasBookmarks,
                }
              : undefined
          }
          hasReaderAccounts={hasReaderAccounts}
          actions={
            <>
              {!hasLanguageSwitcher && <ThemeToggleButton />}
              <AuthMenu
                oauthProviderIds={oauthProviderIds}
                accountControl={accountControl}
                hasBookmarks={hasBookmarks}
                hasReaderAccounts={hasReaderAccounts}
              />
            </>
          }
        />
      </Header>
    </StickyHeaderFrame>
  );
};
