import type { ILocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import { PostDetailPage } from '@web/components/post-detail-page/post-detail-page';
import { routing } from '@web/i18n/routing';
import { buildPostMetadata } from '@web/metadata/post-metadata';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ILocalizedParams & { slug: string }>;
};

export async function generateStaticParams() {
  const params = await service.pages.post.v1.getPostParams();

  return routing.locales.flatMap((locale) =>
    params.map(({ slug }) => ({ locale, slug })),
  );
}

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  const { slug } = await params;
  return buildPostMetadata(slug);
}

export default async function BlogPostPage({ params }: TProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  return <PostDetailPage slug={slug} locale={locale} />;
}
