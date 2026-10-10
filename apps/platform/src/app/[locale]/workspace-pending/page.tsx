import { WorkspacePendingView } from '@platform/components/features/layout/workspace-pending-view';
import { auth } from '@platform/server/auth/auth';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
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
  const session = await auth();

  if (!session?.user?.id) {
    redirect(adminRoutes.signIn());
  }

  return <WorkspacePendingView />;
}
