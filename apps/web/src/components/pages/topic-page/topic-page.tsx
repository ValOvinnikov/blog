import { TAXONOMY_KIND } from '@blog/config';
import { FaqPageSchema } from '@web/components/features/faq-page-schema';
import { TopicBreadcrumbs } from '@web/components/features/topic/topic-breadcrumbs';
import { TopicChips } from '@web/components/features/topic/topic-chips';
import { PageShell } from '@web/components/page-templates/page-shell';
import { getTopicPage } from '@web/server/topic/get-topic-page/get-topic-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';

import { TopicModuleRenderer } from './topic-module-renderer';

type TTopicPageProps = {
  slug: string;
  page?: number;
};

export const TopicPage = async ({ slug, page }: TTopicPageProps) => {
  const result = await getTopicPage(slug);
  const pageData = guardPageLoaderResult(result, 'topic_page.fetch_failed', {
    slug,
  });
  const { topic, headingBlock, hero, modules, faqs } = pageData;

  const currentPage = page ?? 1;

  return (
    <PageShell>
      <PageShell.Breadcrumbs>
        <TopicBreadcrumbs slug={slug} />
      </PageShell.Breadcrumbs>
      <FaqPageSchema faqs={faqs} />
      <TopicModuleRenderer
        hero={hero}
        headingBlock={headingBlock}
        modules={modules}
        context={{
          page: currentPage,
          archive: {
            id: topic.id,
            kind: TAXONOMY_KIND.TOPICS,
            slug,
            name: topic.title,
          },
        }}
      >
        <TopicChips activeSlug={slug} />
      </TopicModuleRenderer>
    </PageShell>
  );
};
