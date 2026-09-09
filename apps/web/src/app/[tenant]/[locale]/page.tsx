import type { ITenantLocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import { PageShell } from '@web/components/page-templates/page-shell';
import { PageHeading } from '@web/components/shared/page-heading';
import { PageIntro } from '@web/components/shared/page-intro';
import { toMetadata } from '@web/metadata/to-metadata';
import { ModuleRenderer } from '@web/modules/module-renderer';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
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

  return toMetadata(result.data.seo, {
    canonical: '/',
    ogType: 'website',
    titleAbsolute: true,
  });
}

export default async function HomePage({ params }: TProps) {
  const { locale, tenant } = await params;
  setRequestLocale(locale);

  const tenantContext = await getTenantSanityContext(tenant);
  const result = await service.pages.home.v1.getHomePage(tenantContext);
  const { sectionHeader, hero, modules } = guardPageLoaderResult(
    result,
    'home_page.fetch_failed',
  );
  const { heading, supportingText } = sectionHeader;

  return (
    <PageShell>
      <PageShell.Heading>
        <PageIntro hero={hero} locale={locale} tenant={tenant}>
          {heading ? (
            <PageHeading heading={heading} supportingText={supportingText} />
          ) : null}
        </PageIntro>
      </PageShell.Heading>
      <PageShell.Content>
        <ModuleRenderer modules={modules} locale={locale} tenant={tenant} />
      </PageShell.Content>
    </PageShell>
  );
}
