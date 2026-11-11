import type { ITenantLocalizedParams } from '@blog/config';
import { BlogPostPage } from '@web/components/pages/blog-post-page';
import { buildPostMetadata } from '@web/metadata/post-metadata';
import { enterDraftPreview } from '@web/server/draft-preview/enter-draft-preview/enter-draft-preview';
import type { Metadata } from 'next';

type TProps = {
  params: Promise<ITenantLocalizedParams & { slug: string }>;
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  await enterDraftPreview(params);
  const { slug } = await params;
  return buildPostMetadata(slug);
}

export default async function DraftBlogPostSlugPage({ params }: TProps) {
  const { slug } = await params;
  await enterDraftPreview(params);

  return <BlogPostPage slug={slug} />;
}
