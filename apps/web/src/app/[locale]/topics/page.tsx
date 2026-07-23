import type { ILocalizedParams } from '@blog/config';
import { TopicsPage } from '@web/components/pages/topics-page';
import { buildTopicsMetadata } from '@web/metadata/topics-metadata';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ILocalizedParams>;
};

export function generateMetadata(): Metadata {
  return buildTopicsMetadata();
}

export default async function TopicsIndexPage({ params }: TProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <TopicsPage />;
}
