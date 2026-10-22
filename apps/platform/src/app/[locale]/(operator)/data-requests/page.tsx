import { DataRequestView } from '@platform/components/features/data-requests/data-request-view';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('dataRequestsPage');
}

export default async function DataRequestsPage() {
  await requireSuperAdmin();

  return <DataRequestView />;
}
