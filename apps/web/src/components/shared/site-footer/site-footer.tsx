import { ICONS, routes, SIZE } from '@blog/config';
import { service } from '@blog/service';
import { Icon } from '@blog/ui/components/atoms/icon';
import { NavLink } from '@blog/ui/components/atoms/nav-link';
import { Footer } from '@blog/ui/components/organisms/footer';
import { LanguageSwitcher } from '@web/components/shared/language-switcher';
import { SmartLink } from '@web/components/shared/smart-link';
import { SocialLinks } from '@web/components/shared/social-links';
import { routing } from '@web/i18n/routing';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getSiteSettings } from '@web/server/site-settings/get-site-settings/get-site-settings';
import { logger } from '@web/utils/logger/logger';
import { getTranslations } from 'next-intl/server';

export const SiteFooter = async () => {
  const { sanityContext, locale, defaultLocale, liveLocales } =
    await getRequestContext();
  const [settingsResult, footerResult, t] = await Promise.all([
    getSiteSettings(),
    service.global.footer.v1.getFooter(sanityContext),
    getTranslations('rss'),
  ]);

  if (!settingsResult.ok) {
    return null;
  }
  if (!footerResult.ok) {
    logger.error('footer.layout_fetch_failed', {
      error: footerResult.error,
    });
  }

  const { brand } = settingsResult.data;
  const social = footerResult.ok ? footerResult.data.social : [];
  const hasLanguageSwitcher =
    footerResult.ok && footerResult.data.showLanguageSwitcher === true;

  return (
    <Footer dataTestId="site-footer">
      <Footer.Copyright title={brand.name} year={new Date().getFullYear()} />
      <Footer.Nav>
        <SocialLinks profiles={social} />
        {hasLanguageSwitcher && (
          <LanguageSwitcher
            liveLocales={liveLocales ?? [locale]}
            currentLocale={locale}
            defaultLocale={defaultLocale ?? routing.defaultLocale}
          />
        )}
        <NavLink
          as={SmartLink}
          href={routes.rssFeed()}
          icon={<Icon name={ICONS.RSS} size={SIZE.SM} dataTestId="rss-icon" />}
          hasLabel={false}
        >
          {t('feedLinkLabel')}
        </NavLink>
      </Footer.Nav>
    </Footer>
  );
};
