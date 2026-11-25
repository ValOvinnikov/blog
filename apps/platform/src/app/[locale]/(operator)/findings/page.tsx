import { FindingsView } from '@platform/components/features/findings/findings-view';
import { requireAdmin } from '@platform/server/auth/require-admin';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { queries } from '@shinefold/db';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('findings');
}

export default async function FindingsPage() {
  await requireAdmin();

  const findings = await queries.findings.listOpenFindings();

  return <FindingsView findings={findings} />;
}
