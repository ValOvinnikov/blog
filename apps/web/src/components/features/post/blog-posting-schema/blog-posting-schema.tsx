import { JsonLd } from '@web/components/shared/json-ld';
import { POST_LOG } from '@web/constants/post';
import { routing } from '@web/i18n/routing';
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
    POST_LOG.BLOG_POSTING_SCHEMA_FETCH_FAILED,
    { slug },
  );
  const {
    metadataBase,
    sanityContext,
    locale,
    defaultLocale = routing.defaultLocale,
  } = await getRequestContext();
  const schema = buildBlogPostingSchema(post, metadataBase, sanityContext, {
    locale,
    defaultLocale,
  });

  return schema ? <JsonLd schema={schema} /> : null;
};
