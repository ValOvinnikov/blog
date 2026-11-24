import { AdminsView } from '@platform/components/features/platform-admins/admins-view';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { loadPlatformAdmins } from '@platform/server/platform-admins/load-platform-admins';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('adminsPage');
}

export default async function AdminsPage() {
  const { id } = await requireSuperAdmin();

  const { admins, invites } = await loadPlatformAdmins(id);

  return <AdminsView admins={admins} invites={invites} />;
}
