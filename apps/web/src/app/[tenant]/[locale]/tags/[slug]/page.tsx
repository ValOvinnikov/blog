import type { ILocalizedParams } from '@blog/config';
import { TagPage } from '@web/components/pages/tag-page';
import { buildTagMetadata } from '@web/metadata/tag-metadata';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ILocalizedParams & { tenant: string; slug: string }>;
};

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  const { slug } = await params;
  return buildTagMetadata(slug);
}

export default async function TagDetailPage({ params }: TProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  return <TagPage slug={slug} locale={locale} />;
}
