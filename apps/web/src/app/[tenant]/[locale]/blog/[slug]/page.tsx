import type { ILocalizedParams } from '@blog/config';
import { BlogPostPage } from '@web/components/pages/blog-post-page';
import { buildPostMetadata } from '@web/metadata/post-metadata';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ILocalizedParams & { tenant: string; slug: string }>;
};

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  const { slug } = await params;
  return buildPostMetadata(slug);
}

export default async function BlogPostSlugPage({ params }: TProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  return <BlogPostPage slug={slug} />;
}
