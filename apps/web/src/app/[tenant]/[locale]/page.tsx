import type { ITenantLocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import { HomePage } from '@web/components/pages/home-page';
import { toMetadata } from '@web/metadata/to-metadata';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ITenantLocalizedParams>;
};

/** Full Route Cache backstop for a missed purge — kept equal to `CONTENT_ROUTE_REVALIDATE_SECONDS` (Next requires a literal here, not an import). */
export const revalidate = 21600;

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  const { tenant } = await params;
  const tenantContext = await getTenantSanityContext(tenant);
  const result = await service.pages.home.v1.getHomePage(tenantContext);

  if (!result.ok) {
    logger.error('home_page.metadata_fetch_failed', { error: result.error });
    return {};
  }

  if (!result.data) {
    return {};
  }

  return toMetadata(result.data.seo, tenantContext, {
    canonical: '/',
    ogType: 'website',
    titleAbsolute: true,
  });
}

export default async function HomeRoute({ params }: TProps) {
  const { locale, tenant } = await params;
  setRequestLocale(locale);

  return <HomePage locale={locale} tenant={tenant} />;
}
