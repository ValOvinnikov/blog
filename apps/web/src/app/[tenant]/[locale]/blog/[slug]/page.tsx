import type { ITenantLocalizedParams } from '@blog/config';
import { BlogPostPage } from '@web/components/pages/blog-post-page';
import { buildPostMetadata } from '@web/metadata/post-metadata';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ITenantLocalizedParams & { slug: string }>;
};

export function generateStaticParams() {
  return [];
}

/** Full Route Cache backstop for a missed purge — kept equal to `CONTENT_ROUTE_REVALIDATE_SECONDS` (Next requires a literal here, not an import). */
export const revalidate = 21600;

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  const { tenant, slug } = await params;
  return buildPostMetadata(slug, tenant);
}

export default async function BlogPostSlugPage({ params }: TProps) {
  const { locale, tenant, slug } = await params;
  setRequestLocale(locale);

  return <BlogPostPage slug={slug} tenant={tenant} />;
}
