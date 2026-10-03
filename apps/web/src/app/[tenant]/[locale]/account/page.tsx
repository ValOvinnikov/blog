import type { ITenantLocalizedParams } from '@blog/config';
import { AccountPage } from '@web/components/pages/account-page';
import { buildAccountMetadata } from '@web/metadata/account-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import { isReaderAccountEnabled } from '@web/server/settings-features/is-reader-account-enabled/is-reader-account-enabled';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

type TProps = {
  params: Promise<ITenantLocalizedParams>;
};

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  await enterRequestContext(params);
  return buildAccountMetadata();
}

// Renders the signed-in reader's own session (`auth()`, inside `AccountPage`) — never cacheable across users.
export const dynamic = 'force-dynamic';

export default async function AccountRoute({ params }: TProps) {
  await enterRequestContext(params);

  if (!(await isReaderAccountEnabled())) {
    notFound();
  }

  return <AccountPage />;
}
