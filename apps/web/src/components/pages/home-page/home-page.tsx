import { routes } from '@blog/config';
import { FaqPageSchema } from '@web/components/features/faq-page-schema';
import { PageShell } from '@web/components/page-templates/page-shell';
import { routing } from '@web/i18n/routing';
import { getHomePage } from '@web/server/home/get-home-page/get-home-page';
import { getRequestContext } from '@web/server/request-context/request-context';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { redirect } from 'next/navigation';

import { HomeModuleRenderer } from './home-module-renderer';

export const HomePage = async () => {
  const result = await getHomePage();
  const { locale, defaultLocale = routing.defaultLocale } =
    await getRequestContext();

  if (result.ok && !result.data && locale !== defaultLocale) {
    redirect(routes.home());
  }

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
