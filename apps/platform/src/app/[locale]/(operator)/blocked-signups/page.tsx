import { BlockedSignupsView } from '@platform/components/features/blocked-signups/blocked-signups-view';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { loadBlockedSignupEntries } from '@platform/server/signup-block/load-blocked-signup-entries';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('blockedSignupsPage');
}

export default async function BlockedSignupsPage() {
  await requireSuperAdmin();

  const entries = await loadBlockedSignupEntries();

  return <BlockedSignupsView entries={entries} />;
}
