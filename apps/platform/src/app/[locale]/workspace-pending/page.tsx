import { WorkspacePendingView } from '@platform/components/features/layout/workspace-pending-view';
import { requireSessionUserId } from '@platform/server/auth/require-session-user-id';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('workspacePending');
}

/**
 * Session-gated so this page is never publicly reachable — an unauthenticated
 * request redirects to sign-in before any status copy renders.
 */
export default async function WorkspacePendingPage() {
  await requireSessionUserId();

  return <WorkspacePendingView />;
}
