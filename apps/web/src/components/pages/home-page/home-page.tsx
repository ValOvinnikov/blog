import { FaqPageSchema } from '@web/components/features/faq-page-schema';
import { PageShell } from '@web/components/page-templates/page-shell';
import { HOME_PAGE_LOG } from '@web/constants/home-page';
import { getHomePage } from '@web/server/home/get-home-page/get-home-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { redirectMissingLanguagePage } from '@web/utils/redirect-missing-language-page';

import { HomeModuleRenderer } from './home-module-renderer';

export const HomePage = async () => {
  const result = await getHomePage();
  await redirectMissingLanguagePage(result);

  const { id, headingBlock, headingAlignment, hero, modules, faqs } =
    guardPageLoaderResult(result, HOME_PAGE_LOG.PAGE_FETCH_FAILED);

  return (
    <PageShell>
      <FaqPageSchema faqs={faqs} />
      <HomeModuleRenderer
        homePageId={id}
        hero={hero}
        headingBlock={headingBlock}
        headingAlignment={headingAlignment}
        modules={modules}
      />
    </PageShell>
  );
};
