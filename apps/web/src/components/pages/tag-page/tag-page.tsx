import { TAXONOMY_KIND } from '@blog/config';
import { TagBreadcrumbs } from '@web/components/features/tag/tag-breadcrumbs';
import { PageShell } from '@web/components/page-templates/page-shell';
import { getTagPage } from '@web/server/tag/get-tag-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';

import { TagModuleRenderer } from './tag-module-renderer';

type TTagPageProps = {
  slug: string;
  page?: number;
  locale: string;
  tenant: string;
};

export const TagPage = async ({
  slug,
  page,
  locale,
  tenant,
}: TTagPageProps) => {
  const result = await getTagPage(slug, tenant);
  const pageData = guardPageLoaderResult(result, 'tag_page.fetch_failed', {
    slug,
  });
  const { tag, headingBlock, hero, modules } = pageData;

  const currentPage = page ?? 1;

  return (
    <PageShell>
      <PageShell.Breadcrumbs>
        <TagBreadcrumbs slug={slug} tenant={tenant} />
      </PageShell.Breadcrumbs>
      <TagModuleRenderer
        hero={hero}
        headingBlock={headingBlock}
        hasTrailingSpace={false}
        modules={modules}
        context={{
          page: currentPage,
          archive: { kind: TAXONOMY_KIND.TAGS, slug, name: tag.title },
        }}
        locale={locale}
        tenant={tenant}
      />
    </PageShell>
  );
};
