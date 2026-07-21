import type { ILocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import { BlogPostPage } from '@web/components/pages/blog-post-page';
import { routing } from '@web/i18n/routing';
import { buildPostMetadata } from '@web/metadata/post-metadata';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ILocalizedParams & { slug: string }>;
};

// Posts beyond the build-time list still render on demand via ISR
// (dynamicParams defaults to true); correctness rides on getPost's own
// notFound() handling, not on this list.
export async function generateStaticParams() {
  try {
    const params = await service.pages.post.v1.getPostParams();

    return routing.locales.flatMap((locale) =>
      params.map(({ slug }) => ({ locale, slug })),
    );
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

  return <BlogPostPage slug={slug} locale={locale} />;
}
