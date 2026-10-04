import { JsonLd } from '@web/components/shared/json-ld';
import { getPostPage } from '@web/server/post/get-post-page/get-post-page';
import { getRequestContext } from '@web/server/request-context/request-context';
import { buildBlogPostingSchema } from '@web/utils/build-blog-posting-schema';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';

export type TBlogPostingSchemaProps = {
  slug: string;
};

export const BlogPostingSchema = async ({ slug }: TBlogPostingSchemaProps) => {
  const result = await getPostPage(slug);
  const post = guardPageLoaderResult(
    result,
    'blog_posting_schema.fetch_failed',
    { slug },
  );
  const { metadataBase, sanityContext } = await getRequestContext();
  const schema = buildBlogPostingSchema(post, metadataBase, sanityContext);

  return schema ? <JsonLd schema={schema} /> : null;
};
