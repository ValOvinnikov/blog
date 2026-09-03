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

  const tenantIds = [
    ...new Set(
      findings.flatMap((finding) =>
        finding.tenantId ? [finding.tenantId] : [],
      ),
    ),
  ];
  const tenants =
    tenantIds.length > 0
      ? await queries.tenants.listTenantsByIds(tenantIds)
      : [];
  const tenantNamesById = Object.fromEntries(
    tenants.map((tenant) => [tenant.id, tenant.name]),
  );

  return <FindingsView findings={findings} tenantNamesById={tenantNamesById} />;
}
