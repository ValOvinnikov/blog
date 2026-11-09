import type { TSectionIndexType } from '@blog/service';
import { FaqPageSchema } from '@web/components/features/faq-page-schema';
import { PageShell } from '@web/components/page-templates/page-shell';
import { LandingModuleRenderer } from '@web/components/pages/landing-page/landing-module-renderer';
import { SECTION_INDEX_LOG } from '@web/constants/section-index';
import { getSectionIndexPage } from '@web/server/section-index/get-section-index-page/get-section-index-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { sectionIndexHref } from '@web/utils/section-index-href';

type TSectionIndexPageProps = { type: TSectionIndexType };

export const SectionIndexPage = async ({ type }: TSectionIndexPageProps) => {
  const result = await getSectionIndexPage(type);
  const { id, headingBlock, headingAlignment, hero, modules, faqs } =
    guardPageLoaderResult(result, SECTION_INDEX_LOG.PAGE_FETCH_FAILED, {
      type,
    });

  return (
    <PageShell>
      <FaqPageSchema faqs={faqs} />
      <LandingModuleRenderer
        hero={hero}
        headingBlock={headingBlock}
        headingAlignment={headingAlignment}
        modules={modules}
        landingPage={{ id, path: sectionIndexHref(type) }}
      />
    </PageShell>
  );
};
