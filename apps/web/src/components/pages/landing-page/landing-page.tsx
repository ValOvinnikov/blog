import type { ITenantLocalizedParams } from '@blog/config';
import { LandingBreadcrumbs } from '@web/components/features/landing/landing-breadcrumbs';
import { PageShell } from '@web/components/page-templates/page-shell';
import { getLandingPage } from '@web/server/landing/get-landing-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { resolvePageIntroAndContent } from '@web/utils/resolve-page-intro-and-content';

type TLandingPageProps = ITenantLocalizedParams & { slug: string };

/**
 * LandingPage — `/{slug}` composition for standalone `page_landing`
 * documents. Site chrome (`Header`/`Footer`) stays owned by
 * `[tenant]/[locale]/layout.tsx`. Fetches the page once — purely to decide
 * `notFound()` and to choose between the hero slot and the `headingBlock`
 * heading — and composes every other concern as a self-fetching part
 * reading the same cached `getLandingPage` loader.
 */
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
  const { intro, content } = await resolvePageIntroAndContent({
    hero,
    headingBlock,
    modules,
    locale,
    tenant,
  });

  return (
    <PageShell>
      <PageShell.Breadcrumbs>
        <LandingBreadcrumbs slug={slug} tenant={tenant} />
      </PageShell.Breadcrumbs>
      <PageShell.Heading>{intro}</PageShell.Heading>
      <PageShell.Content>{content}</PageShell.Content>
    </PageShell>
  );
};
