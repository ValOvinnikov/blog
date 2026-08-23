import type { ILocalizedParams } from '@blog/config';
import { TagsPage } from '@web/components/pages/tags-page';
import { buildTagsMetadata } from '@web/metadata/tags-metadata';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ILocalizedParams>;
};

export function generateMetadata(): Promise<Metadata> {
  return buildTagsMetadata();
}

export default async function TagsIndexPage({ params }: TProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <TagsPage />;
}
