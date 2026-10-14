import { queries } from '@blog/db';
import { FindingsView } from '@platform/components/features/findings/findings-view';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('findings');
}

export default async function FindingsPage() {
  const findings = await queries.findings.listOpenFindings();

  return <FindingsView findings={findings} />;
}
