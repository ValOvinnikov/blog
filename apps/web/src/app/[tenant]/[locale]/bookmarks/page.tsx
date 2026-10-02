import type { ITenantLocalizedParams } from '@blog/config';
import { BookmarksPage } from '@web/components/pages/bookmarks-page';
import { buildBookmarksMetadata } from '@web/metadata/bookmarks-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import type { Metadata } from 'next';

type TProps = {
  params: Promise<ITenantLocalizedParams>;
};

export function generateMetadata(): Promise<Metadata> {
  return buildBookmarksMetadata();
}

// Renders the signed-in reader's own bookmarks (`auth()`, inside `BookmarksPage`) — never cacheable across users.
export const dynamic = 'force-dynamic';

export default async function BookmarksRoute({ params }: TProps) {
  await enterRequestContext(params);

  return <BookmarksPage />;
}
