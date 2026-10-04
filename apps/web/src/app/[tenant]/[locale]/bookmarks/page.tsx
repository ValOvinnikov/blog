import type { ITenantLocalizedParams } from '@blog/config';
import { BookmarksPage } from '@web/components/pages/bookmarks-page';
import { buildBookmarksMetadata } from '@web/metadata/bookmarks-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import { isReaderAccountEnabled } from '@web/server/settings-features/is-reader-account-enabled/is-reader-account-enabled';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

type TProps = {
  params: Promise<ITenantLocalizedParams>;
};

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  await enterRequestContext(params);
  return buildBookmarksMetadata();
}

// Renders the signed-in reader's own bookmarks (`auth()`, inside `BookmarksPage`) — never cacheable across users.
export const dynamic = 'force-dynamic';

export default async function BookmarksRoute({ params }: TProps) {
  await enterRequestContext(params);

  if (!(await isReaderAccountEnabled())) {
    notFound();
  }

  return <BookmarksPage />;
}
