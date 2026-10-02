import type { ITenantLocalizedParams } from '@blog/config';
import { BookmarksPage } from '@web/components/pages/bookmarks-page';
import { buildBookmarksMetadata } from '@web/metadata/bookmarks-metadata';
import { isReaderAccountEnabled } from '@web/server/settings-features/is-reader-account-enabled';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ITenantLocalizedParams>;
};

export function generateMetadata(): Promise<Metadata> {
  return buildBookmarksMetadata();
}

// Renders the signed-in reader's own bookmarks (`auth()`, inside `BookmarksPage`) — never cacheable across users.
export const dynamic = 'force-dynamic';

export default async function BookmarksRoute({ params }: TProps) {
  const { locale, tenant } = await params;
  setRequestLocale(locale);

  if (!(await isReaderAccountEnabled(tenant))) {
    notFound();
  }

  return <BookmarksPage />;
}
