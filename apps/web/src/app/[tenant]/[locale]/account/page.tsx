import type { ITenantLocalizedParams } from '@blog/config';
import { AccountPage } from '@web/components/pages/account-page';
import { buildAccountMetadata } from '@web/metadata/account-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import { isReaderAccountEnabled } from '@web/server/settings-features/is-reader-account-enabled';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

type TProps = {
  params: Promise<ITenantLocalizedParams>;
};

export function generateMetadata(): Promise<Metadata> {
  return buildAccountMetadata();
}

// Renders the signed-in reader's own session (`auth()`, inside `AccountPage`) — never cacheable across users.
export const dynamic = 'force-dynamic';

export default async function AccountRoute({ params }: TProps) {
  const { tenant } = await params;
  await enterRequestContext(params);

  if (!(await isReaderAccountEnabled(tenant))) {
    notFound();
  }

  return <AccountPage />;
}
