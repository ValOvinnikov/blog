import { FaqPageSchema } from '@web/components/features/faq-page-schema';
import { PageShell } from '@web/components/page-templates/page-shell';
import { getHomePage } from '@web/server/home/get-home-page/get-home-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { redirectMissingLanguagePage } from '@web/utils/redirect-missing-language-page';

import { HomeModuleRenderer } from './home-module-renderer';

export const HomePage = async () => {
  const result = await getHomePage();
  await redirectMissingLanguagePage(result);

  const { headingBlock, headingAlignment, hero, modules, faqs } =
    guardPageLoaderResult(result, 'home_page.fetch_failed');

  return (
    <PageShell>
      <FaqPageSchema faqs={faqs} />
      <HomeModuleRenderer
        hero={hero}
        headingBlock={headingBlock}
        headingAlignment={headingAlignment}
        modules={modules}
      />
    </PageShell>
  );
};
