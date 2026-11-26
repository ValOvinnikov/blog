import { FaqPageSchema } from '@web/components/features/faq-page-schema';
import { LandingBreadcrumbs } from '@web/components/features/landing/landing-breadcrumbs';
import { PageShell } from '@web/components/page-templates/page-shell';
import { LANDING_PAGE_LOG } from '@web/constants/landing-page';
import { getLandingPage } from '@web/server/landing/get-landing-page/get-landing-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { redirectMovedLandingPage } from '@web/utils/redirect-moved-landing-page';

import { LandingModuleRenderer } from './landing-module-renderer';

type TLandingPageProps = { path: string };

export const LandingPage = async ({ path }: TLandingPageProps) => {
  const result = await getLandingPage(path);
  await redirectMovedLandingPage(result, path);
  const page = guardPageLoaderResult(
    result,
    LANDING_PAGE_LOG.PAGE_FETCH_FAILED,
    { path },
  );
  const { id, headingBlock, headingAlignment, hero, modules, faqs } = page;

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
        navigation={page}
      />
    </PageShell>
  );
};
