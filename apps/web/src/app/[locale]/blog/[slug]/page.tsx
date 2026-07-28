import type { ILocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import { BlogPostPage } from '@web/components/pages/blog-post-page';
import { buildPostMetadata } from '@web/metadata/post-metadata';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ILocalizedParams & { slug: string }>;
};

// CI's build environment can't always construct the Sanity client; an
// uncaught throw here would crash the entire `next build`. `dynamicParams`
// stays default `true`, so a missed build-time slug still renders on demand.
export async function generateStaticParams() {
  try {
    const params = await service.pages.post.v1.getPostParams();

    return params.map(({ slug }) => ({ slug }));
  } catch (error) {
    console.error('Error to fetch post params:', error);
    return [];
  }
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
