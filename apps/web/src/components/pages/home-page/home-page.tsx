import { service } from '@blog/service';
import { FaqPageSchema } from '@web/components/features/faq-page-schema';
import { PageShell } from '@web/components/page-templates/page-shell';
import { getRequestContext } from '@web/server/request-context/request-context';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';

import { HomeModuleRenderer } from './home-module-renderer';

export const HomePage = async () => {
  const { sanityContext } = await getRequestContext();
  const result = await service.pages.home.v1.getHomePage(sanityContext);
  const { headingBlock, hero, modules, faqs } = guardPageLoaderResult(
    result,
    'home_page.fetch_failed',
  );

  return (
    <PageShell>
      <FaqPageSchema faqs={faqs} />
      <HomeModuleRenderer
        hero={hero}
        headingBlock={headingBlock}
        modules={modules}
      />
    </PageShell>
  );
};
