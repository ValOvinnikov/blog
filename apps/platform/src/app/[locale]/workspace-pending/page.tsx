import { WorkspacePendingView } from '@platform/components/features/layout/workspace-pending-view';
import { getSessionEmail } from '@platform/server/auth/get-session-email';
import { requireSessionUserId } from '@platform/server/auth/require-session-user-id';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('workspacePending');
}

export default async function WorkspacePendingPage() {
  const [, accountEmail] = await Promise.all([
    requireSessionUserId(),
    getSessionEmail(),
  ]);

  return <WorkspacePendingView accountEmail={accountEmail} />;
}
