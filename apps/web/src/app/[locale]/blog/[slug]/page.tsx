import type { ILocalizedParams } from '@blog/config';
import { getPlatformSanityContext, service } from '@blog/service';
import { BlogPostPage } from '@web/components/pages/blog-post-page';
import { buildPostMetadata } from '@web/metadata/post-metadata';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ILocalizedParams & { slug: string }>;
};

export async function generateStaticParams() {
  const result = await service.pages.post.v1.getPostParams(
    getPlatformSanityContext(),
  );

  if (!result.ok) {
    logger.error('blog_post.params_fetch_failed', { error: result.error });
    return [];
  }

  const params = result.data;

  // A successful (non-throwing) query that resolves to zero posts is not a
  // legitimate "no content yet" case in a real build — `page_post` documents
  // exist in production. It can mean `SANITY_API_READ_TOKEN` wasn't available
  // at build time (e.g. a Vercel "Sensitive" env var, redacted during
  // `vercel build`), so the anonymous client silently returns an empty array
  // instead of throwing — shipping zero prebuilt paths and a broken 500
  // fallback instead of a clean 404 for every slug. This check is separate
  // from the `if (!result.ok)` guard above, which only catches a genuine
  // connection/config error — a successful-but-empty result needs its own
  // check here.
  if (params.length === 0 && !process.env.SKIP_ENV_VALIDATION) {
    throw new Error(
      "generateStaticParams for blog/[slug] returned zero posts in a real build — this usually means SANITY_API_READ_TOKEN wasn't available at build time or page_post documents aren't readable with it; set SKIP_ENV_VALIDATION=true if this build genuinely has no Sanity access.",
    );
  }

  return params.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  const { slug } = await params;
  return buildPostMetadata(slug);
}

export default async function BlogPostSlugPage({ params }: TProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  return <BlogPostPage slug={slug} />;
}
