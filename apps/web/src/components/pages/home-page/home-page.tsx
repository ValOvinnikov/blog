import type { ITenantLocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import { PageShell } from '@web/components/page-templates/page-shell';
import { PageIntro } from '@web/components/shared/page-intro';
import { ModuleRenderer } from '@web/modules/module-renderer';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';

type THomePageProps = ITenantLocalizedParams;

/**
 * HomePage — `/` composition. Fetches the `page_home` document once and
 * composes every other concern as a self-fetching part reading the same
 * `getHomePage` call.
 */
export const HomePage = async ({ locale, tenant }: THomePageProps) => {
  const tenantContext = await getTenantSanityContext(tenant);
  const result = await service.pages.home.v1.getHomePage(tenantContext);
  const { headingBlock, hero, modules } = guardPageLoaderResult(
    result,
    'home_page.fetch_failed',
  );

  return (
    <PageShell>
      <PageShell.Heading>
        <PageIntro
          hero={hero}
          headingBlock={headingBlock}
          locale={locale}
          tenant={tenant}
        />
      </PageShell.Heading>
      <PageShell.Content>
        <ModuleRenderer modules={modules} locale={locale} tenant={tenant} />
      </PageShell.Content>
    </PageShell>
  );
};
