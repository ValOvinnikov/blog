import { queries } from '@blog/db';
import { FindingsView } from '@platform/components/features/findings/findings-view';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pageMetadata');
  return { title: t('findings') };
}

export default async function FindingsPage() {
  const findings = await queries.findings.listOpenFindings();

  return <FindingsView findings={findings} />;
}
