import type { ITenantLocalizedParams } from '@blog/config';
import { LandingBreadcrumbs } from '@web/components/features/landing/landing-breadcrumbs';
import { PageShell } from '@web/components/page-templates/page-shell';
import { getLandingPage } from '@web/server/landing/get-landing-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';

import { LandingModuleRenderer } from './landing-module-renderer';

type TLandingPageProps = ITenantLocalizedParams & { slug: string };

export const LandingPage = async ({
  slug,
  locale,
  tenant,
}: TLandingPageProps) => {
  const result = await getLandingPage(slug, tenant);
  const page = guardPageLoaderResult(result, 'landing_page.fetch_failed', {
    slug,
  });
  const { headingBlock, hero, modules } = page;

  return (
    <PageShell>
      <PageShell.Breadcrumbs>
        <LandingBreadcrumbs slug={slug} tenant={tenant} />
      </PageShell.Breadcrumbs>
      <LandingModuleRenderer
        hero={hero}
        headingBlock={headingBlock}
        modules={modules}
        locale={locale}
        tenant={tenant}
      />
    </PageShell>
  );
};
