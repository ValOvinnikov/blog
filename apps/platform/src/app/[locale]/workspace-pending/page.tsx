import { WorkspacePendingView } from '@platform/components/features/layout/workspace-pending-view';
import { requireSessionUserId } from '@platform/server/auth/require-session-user-id';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pageMetadata');
  return { title: t('workspacePending') };
}

/**
 * Session-gated so this page is never publicly reachable — an unauthenticated
 * request redirects to sign-in before any status copy renders.
 */
export default async function WorkspacePendingPage() {
  await requireSessionUserId();

  return <WorkspacePendingView />;
}
