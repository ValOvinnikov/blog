import { type ITenantLocalizedParams, LOCALE_BCP47_TAGS } from '@blog/config';
import { DocumentShell } from '@web/components/shared/document-shell';
import { SiteAnalytics } from '@web/components/shared/site-analytics';
import { SiteFooter } from '@web/components/shared/site-footer';
import { SiteHeader } from '@web/components/shared/site-header';
import { SiteProviders } from '@web/components/shared/site-providers';
import { ThemeScope } from '@web/components/shared/theme-scope';
import { SITE_SETTINGS_LOG } from '@web/constants/site-settings';
import { routing } from '@web/i18n/routing';
import {
  enterRequestContext,
  getRequestContext,
} from '@web/server/request-context/request-context';
import { getSiteSettings } from '@web/server/site-settings/get-site-settings/get-site-settings';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
import { getThemeTokens } from '@web/utils/get-theme-tokens';
import { isProductionEnvironment } from '@web/utils/is-production-environment';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { localeLayoutVariants } from './layout-variants';

type TGenerateMetadataProps = {
  params: Promise<ITenantLocalizedParams>;
};

export async function generateMetadata({
  params,
}: TGenerateMetadataProps): Promise<Metadata> {
  await enterRequestContext(params);
  const { metadataBase } = await getRequestContext();
  const result = await getSiteSettings();

  const robotsMetadata = isProductionEnvironment()
    ? {}
    : { robots: { index: false, follow: false } };

  if (!result.ok) {
    logger.error(SITE_SETTINGS_LOG.METADATA_FETCH_FAILED, {
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
  await enterRequestContext(params);
  const { tenantId, locale, isOperatorSuspended } = await getRequestContext();
  const tenant = tenantId ?? UNRESOLVED_TENANT_PLACEHOLDER;
  const [settingsResult, themeTokens] = await Promise.all([
    getSiteSettings(),
    getThemeTokens(tenant),
  ]);

  if (!settingsResult.ok) {
    logger.error(SITE_SETTINGS_LOG.LAYOUT_FETCH_FAILED, {
      error: settingsResult.error,
    });
    // Caught by `[tenant]/not-found.tsx`; a same-segment `not-found.tsx` does not guard this layout itself.
    notFound();
  }

  const s = localeLayoutVariants();

  return (
    <DocumentShell lang={LOCALE_BCP47_TAGS[locale]}>
      <ThemeScope themeTokens={themeTokens}>
        <SiteProviders>
          <div className={s.root()}>
            {!isOperatorSuspended && <SiteHeader />}
            <div className={s.content()}>{children}</div>
            {!isOperatorSuspended && <SiteFooter />}
          </div>
        </SiteProviders>
        <SiteAnalytics />
      </ThemeScope>
    </DocumentShell>
  );
}
