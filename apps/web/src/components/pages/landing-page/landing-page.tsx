import { FaqPageSchema } from '@web/components/features/faq-page-schema';
import { LandingBreadcrumbs } from '@web/components/features/landing/landing-breadcrumbs';
import { SectionNavigation } from '@web/components/features/landing/section-navigation';
import { PageShell } from '@web/components/page-templates/page-shell';
import { getLandingPage } from '@web/server/landing/get-landing-page/get-landing-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { redirectMovedLandingPage } from '@web/utils/redirect-moved-landing-page';

import { LandingModuleRenderer } from './landing-module-renderer';
import { landingPageVariants } from './landing-page-variants';

type TLandingPageProps = { path: string };

const s = landingPageVariants();

export const LandingPage = async ({ path }: TLandingPageProps) => {
  const result = await getLandingPage(path);
  await redirectMovedLandingPage(result, path);
  const page = guardPageLoaderResult(result, 'landing_page.fetch_failed', {
    path,
  });
  const { headingBlock, hero, modules, faqs, sectionNavigation } = page;

  const content = (
    <LandingModuleRenderer
      hero={hero}
      headingBlock={headingBlock}
      modules={modules}
    />
  );

  return (
    <PageShell>
      <PageShell.Breadcrumbs>
        <LandingBreadcrumbs path={path} />
      </PageShell.Breadcrumbs>
      <FaqPageSchema faqs={faqs} />
      {sectionNavigation ? (
        <div className={s.layout()}>
          <SectionNavigation
            className={s.sidebar()}
            sectionNavigation={sectionNavigation}
          />
          <div className={s.content()}>{content}</div>
        </div>
      ) : (
        content
      )}
    </PageShell>
  );
};
