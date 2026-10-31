import type { ITenantLocalizedParams } from '@blog/config';
import { AccountPage } from '@web/components/pages/account-page';
import { buildAccountMetadata } from '@web/metadata/account-metadata';
import { auth } from '@web/server/auth/auth';
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

// A reader signed in before the site's reader features went off keeps export and deletion here.
const isAccountReachable = async (): Promise<boolean> =>
  (await isReaderAccountEnabled()) || Boolean((await auth())?.user?.id);

// Reads the signed-in reader's own session — never cacheable across users.
export const dynamic = 'force-dynamic';

export default async function AccountRoute({ params }: TProps) {
  await enterRequestContext(params);

  if (!(await isAccountReachable())) {
    notFound();
  }

  return <AccountPage />;
}
