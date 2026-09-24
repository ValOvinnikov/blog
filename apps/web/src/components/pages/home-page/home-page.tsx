import type { ITenantLocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import { FaqPageSchema } from '@web/components/features/faq-page-schema';
import { PageShell } from '@web/components/page-templates/page-shell';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';

import { HomeModuleRenderer } from './home-module-renderer';

type THomePageProps = ITenantLocalizedParams;

export const HomePage = async ({ locale, tenant }: THomePageProps) => {
  const tenantContext = await getTenantSanityContext(tenant);
  const result = await service.pages.home.v1.getHomePage(tenantContext);
  const { headingBlock, hero, modules, faqs } = guardPageLoaderResult(
    result,
    'home_page.fetch_failed',
  );

  return (
    <PageShell>
      {faqs.length > 0 && <FaqPageSchema faqs={faqs} />}
      <HomeModuleRenderer
        hero={hero}
        headingBlock={headingBlock}
        modules={modules}
        locale={locale}
        tenant={tenant}
      />
    </PageShell>
  );
};
