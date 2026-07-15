import type { ILocalizedParams } from '@blog/config';
import { buildBlogListMetadata } from '@web/components/blog-list-page/blog-list-metadata';
import { BlogListPage } from '@web/components/blog-list-page/blog-list-page';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ILocalizedParams>;
};

export function generateMetadata(): Promise<Metadata> {
  return buildBlogListMetadata(1);
}

export default async function BlogIndexPage({ params }: TProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <BlogListPage page={1} locale={locale} />;
}
