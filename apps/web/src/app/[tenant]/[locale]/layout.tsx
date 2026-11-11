import { type ITenantLocalizedParams, LOCALE_BCP47_TAGS } from '@blog/config';
import { SiteProviders } from '@web/components/features/layout/site-providers';
import { PreviewBanner } from '@web/components/features/preview/preview-banner';
import { DocumentShell } from '@web/components/shared/document-shell';
import { SiteAnalytics } from '@web/components/shared/site-analytics';
import { SiteFooter } from '@web/components/shared/site-footer';
import { SiteHeader } from '@web/components/shared/site-header';
import { ThemeScope } from '@web/components/shared/theme-scope';
import { routing } from '@web/i18n/routing';
import {
  enterRequestContext,
  getRequestContext,
} from '@web/server/request-context/request-context';
import { getBrandName } from '@web/server/site-config/get-brand-name/get-brand-name';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
import { getThemeTokens } from '@web/utils/get-theme-tokens';
import { isProductionEnvironment } from '@web/utils/is-production-environment';
import type { Metadata } from 'next';

import { localeLayoutVariants } from './layout-variants';

type TGenerateMetadataProps = {
  params: Promise<ITenantLocalizedParams>;
};

export async function generateMetadata({
  params,
}: TGenerateMetadataProps): Promise<Metadata> {
  await enterRequestContext(params);
  const requestContext = await getRequestContext();
  const brandName = await getBrandName(requestContext);

  const robotsMetadata = isProductionEnvironment()
    ? {}
    : { robots: { index: false, follow: false } };

  return {
    metadataBase: requestContext.metadataBase,
    ...(brandName && {
      title: { default: brandName, template: `%s | ${brandName}` },
    }),
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
  const {
    tenantId,
    locale,
    defaultLocale = routing.defaultLocale,
    isOperatorSuspended,
    isDraftPreview,
  } = await getRequestContext();
  const tenant = tenantId ?? UNRESOLVED_TENANT_PLACEHOLDER;
  const themeTokens = await getThemeTokens(tenant);

  const s = localeLayoutVariants();

  return (
    <DocumentShell lang={LOCALE_BCP47_TAGS[locale]}>
      <ThemeScope themeTokens={themeTokens}>
        <SiteProviders>
          <div className={s.root()}>
            {isDraftPreview && (
              <PreviewBanner locale={locale} defaultLocale={defaultLocale} />
            )}
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
