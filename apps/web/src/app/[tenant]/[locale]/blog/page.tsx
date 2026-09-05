import type { ITenantLocalizedParams } from '@blog/config';
import { BlogListPage } from '@web/components/pages/blog-list-page';
import { buildBlogListMetadata } from '@web/metadata/blog-list-metadata';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ITenantLocalizedParams>;
};

/** Full Route Cache backstop for a missed purge — kept equal to `CONTENT_ROUTE_REVALIDATE_SECONDS` (Next requires a literal here, not an import). */
export const revalidate = 21600;

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  const { tenant } = await params;
  return buildBlogListMetadata(1, tenant);
}

export default async function BlogIndexPage({ params }: TProps) {
  const { locale, tenant } = await params;
  setRequestLocale(locale);

  return <BlogListPage page={1} locale={locale} tenant={tenant} />;
}
