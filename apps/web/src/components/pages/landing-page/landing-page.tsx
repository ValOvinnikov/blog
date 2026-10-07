import { FaqPageSchema } from '@web/components/features/faq-page-schema';
import { LandingBreadcrumbs } from '@web/components/features/landing/landing-breadcrumbs';
import { PageShell } from '@web/components/page-templates/page-shell';
import { getLandingPage } from '@web/server/landing/get-landing-page/get-landing-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { redirectMovedLandingPage } from '@web/utils/redirect-moved-landing-page';

import { LandingModuleRenderer } from './landing-module-renderer';

type TLandingPageProps = { path: string };

export const LandingPage = async ({ path }: TLandingPageProps) => {
  const result = await getLandingPage(path);
  await redirectMovedLandingPage(result, path);
  const page = guardPageLoaderResult(result, 'landing_page.fetch_failed', {
    path,
  });
  const {
    id,
    headingBlock,
    headingAlignment,
    hero,
    modules,
    faqs,
    sectionNavigation,
  } = page;

  return (
    <PageShell>
      <PageShell.Breadcrumbs>
        <LandingBreadcrumbs path={path} isAbovePageHeading={!hero} />
      </PageShell.Breadcrumbs>
      <FaqPageSchema faqs={faqs} />
      <LandingModuleRenderer
        hero={hero}
        headingBlock={headingBlock}
        headingAlignment={headingAlignment}
        modules={modules}
        landingPage={{ id, path }}
        sectionNavigation={sectionNavigation}
      />
    </PageShell>
  );
};
