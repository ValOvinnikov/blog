import { FaqPageSchema } from '@web/components/features/faq-page-schema';
import { LandingBreadcrumbs } from '@web/components/features/landing/landing-breadcrumbs';
import { PageShell } from '@web/components/page-templates/page-shell';
import { getLandingPage } from '@web/server/landing/get-landing-page/get-landing-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';

import { LandingModuleRenderer } from './landing-module-renderer';

type TLandingPageProps = { slug: string };

export const LandingPage = async ({ slug }: TLandingPageProps) => {
  const result = await getLandingPage(slug);
  const page = guardPageLoaderResult(result, 'landing_page.fetch_failed', {
    slug,
  });
  const { headingBlock, hero, modules, faqs } = page;

  return (
    <PageShell>
      <PageShell.Breadcrumbs>
        <LandingBreadcrumbs slug={slug} />
      </PageShell.Breadcrumbs>
      <FaqPageSchema faqs={faqs} />
      <LandingModuleRenderer
        hero={hero}
        headingBlock={headingBlock}
        modules={modules}
      />
    </PageShell>
  );
};
