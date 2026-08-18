import type { ILocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import { CategoryPage } from '@web/components/pages/category-page';
import { buildCategoryMetadata } from '@web/metadata/category-metadata';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ILocalizedParams & { slug: string }>;
};

// CI's build environment can't always construct the Sanity client; an
// uncaught throw here would crash the entire `next build`. `dynamicParams`
// stays default `true`, so a missed build-time slug still renders on demand.
export async function generateStaticParams() {
  const result = await service.pages.category.v1.getCategoryParams();

  if (!result.ok) {
    logger.error('category_page.params_fetch_failed', { error: result.error });
    return [];
  }

  return result.data;
}

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  const { slug } = await params;
  return buildCategoryMetadata(slug);
}

export default async function CategoryDetailPage({ params }: TProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  return <CategoryPage slug={slug} />;
}
