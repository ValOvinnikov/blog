import { routes } from '@blog/config';
import { service } from '@blog/service';
import {
  Breadcrumbs,
  type IBreadcrumbItem,
} from '@blog/ui/molecules/breadcrumbs';
import { BlogPageTemplate } from '@web/components/page-templates/blog-page-template';
import { BreadcrumbBar } from '@web/components/shared/breadcrumb-bar';
import { JsonLd } from '@web/components/shared/json-ld';
import { SmartLink } from '@web/components/shared/smart-link';
import { ModuleRenderer } from '@web/modules/module-renderer';
import { PostListModule } from '@web/modules/post-list/post-list-module';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

type TTagPageProps = { slug: string; page?: number; locale: string };

/**
 * TagPage — shared composition for `/tags/[slug]` (page 1, `page`
 * omitted) and `/tags/[slug]/page/[page]` (pages ≥ 2, `page` provided):
 * fetches the `page_tag` shell via the tag service, renders a
 * `Home › Tag: {name}` `Breadcrumbs` trail (plus its `BreadcrumbList`
 * JSON-LD) inside a `BreadcrumbBar` sibling before `<main>`, then the
 * archive itself — via `PostListModule`, reading `page_tag.postList` — as a
 * sibling outside `BlogPageTemplate`'s constrained furniture, mirroring
 * `TopicPage`.
 */
export const TagPage = async ({ slug, page, locale }: TTagPageProps) => {
  const [result, breadcrumbsT, tagPageT] = await Promise.all([
    service.pages.tag.v1.getTagPage(slug),
    getTranslations('breadcrumbs'),
    getTranslations('tagPage'),
  ]);

  if (!result.ok) {
    logger.error('tag_page.fetch_failed', { slug, error: result.error });
    notFound();
  }

  const { tag, modules, postListId } = result.data;

  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? '';
  const trail: IBreadcrumbItem[] = [
    { label: breadcrumbsT('home'), href: routes.home() },
    { label: tagPageT('label', { name: tag.title }), href: routes.tag(slug) },
  ];
  const breadcrumbListSchema = buildBreadcrumbListSchema(trail, siteUrl);

  return (
    <>
      {breadcrumbListSchema && <JsonLd schema={breadcrumbListSchema} />}

      <BreadcrumbBar>
        <Breadcrumbs
          items={trail}
          ariaLabel={breadcrumbsT('ariaLabel')}
          linkAs={SmartLink}
        />
      </BreadcrumbBar>

      <BlogPageTemplate
        heading={tag.title}
        supportingText={tag.description}
        modules={
          <>
            <PostListModule
              id={postListId}
              locale={locale}
              page={page ?? 1}
              createHref={(pageNumber) => routes.tag(slug, pageNumber)}
              ariaLabel={tagPageT('paginationAriaLabel')}
              accessibleTitle={tagPageT('title', { name: tag.title })}
              emptyMessageFallback={tagPageT('empty', { name: tag.title })}
              titleId="tag-posts-title"
            />
            <ModuleRenderer modules={modules} locale={locale} />
          </>
        }
      />
    </>
  );
};
