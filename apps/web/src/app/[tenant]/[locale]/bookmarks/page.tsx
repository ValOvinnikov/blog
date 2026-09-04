import type { ILocalizedParams } from '@blog/config';
import { BookmarksPage } from '@web/components/pages/bookmarks-page';
import { buildBookmarksMetadata } from '@web/metadata/bookmarks-metadata';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ILocalizedParams & { tenant: string }>;
};

export function generateMetadata(): Promise<Metadata> {
  return buildBookmarksMetadata();
}

// No `generateStaticParams` re-export here beyond the locale segment
// (`[locale]/layout.tsx` already provides that one) — this route reads the
// signed-in reader's own session (`auth()`, inside `BookmarksPage`), so it's
// inherently per-request dynamic and was never a static-generation
// candidate.
export default async function BookmarksRoute({ params }: TProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <BookmarksPage />;
}
