import { FeaturesPageContent } from '@admin/components/features-page-content';
import { requireTenantMembership } from '@admin/server/auth/require-tenant-membership';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

type TProps = {
  params: Promise<{ tenantSlug: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pageMetadata');
  return { title: t('features') };
}

export default async function FeaturesPage({ params }: TProps) {
  const { tenantSlug } = await params;
  const { tenant } = await requireTenantMembership(tenantSlug);

  // Called directly (not `<FeaturesPageContent tenant={tenant} />`) — an
  // async component nested via JSX only resolves under React's real RSC
  // renderer, which this repo's `customRenderAsync` test helper doesn't
  // emulate.
  return await FeaturesPageContent({ tenant });
}
