import { TAXONOMY_KIND } from '@blog/config';
import { FaqPageSchema } from '@web/components/features/faq-page-schema';
import { TagBreadcrumbs } from '@web/components/features/tag/tag-breadcrumbs';
import { PageShell } from '@web/components/page-templates/page-shell';
import { getTagPage } from '@web/server/tag/get-tag-page/get-tag-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';

import { TagModuleRenderer } from './tag-module-renderer';

type TTagPageProps = {
  slug: string;
  page?: number;
};

export const TagPage = async ({ slug, page }: TTagPageProps) => {
  const result = await getTagPage(slug);
  const pageData = guardPageLoaderResult(result, 'tag_page.fetch_failed', {
    slug,
  });
  const { tag, headingBlock, headingAlignment, hero, modules, faqs } = pageData;

  const currentPage = page ?? 1;

  return (
    <PageShell>
      <PageShell.Breadcrumbs>
        <TagBreadcrumbs slug={slug} />
      </PageShell.Breadcrumbs>
      <FaqPageSchema faqs={faqs} />
      <TagModuleRenderer
        hero={hero}
        headingBlock={headingBlock}
        headingAlignment={headingAlignment}
        modules={modules}
        context={{
          page: currentPage,
          archive: {
            id: tag.id,
            kind: TAXONOMY_KIND.TAGS,
            slug,
            name: tag.title,
          },
        }}
      />
    </PageShell>
  );
};
