import type { ILocalizedParams } from '@blog/config';
import { BlogListPage } from '@web/components/pages/blog-list-page';
import { buildBlogListMetadata } from '@web/metadata/blog-list-metadata';
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

  return <BlogListPage page={1} />;
}
