import { JsonLd } from '@web/components/shared/json-ld';
import { getPostPage } from '@web/server/post/get-post-page';
import { getTenantBaseUrl } from '@web/server/tenant/get-tenant-base-url';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { buildBlogPostingSchema } from '@web/utils/build-blog-posting-schema';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';

export type TBlogPostingSchemaProps = {
  slug: string;
  tenant: string;
};

/** BlogPostingSchema — the post detail's `BlogPosting` JSON-LD script. */
export const BlogPostingSchema = async ({
  slug,
  tenant,
}: TBlogPostingSchemaProps) => {
  const result = await getPostPage(slug, tenant);
  const post = guardPageLoaderResult(
    result,
    'blog_posting_schema.fetch_failed',
    { slug },
  );
  const [siteUrl, tenantContext] = await Promise.all([
    getTenantBaseUrl(tenant).then((url) => url ?? ''),
    getTenantSanityContext(tenant),
  ]);
  const schema = buildBlogPostingSchema(post, siteUrl, tenantContext);

  return schema ? <JsonLd schema={schema} /> : null;
};
