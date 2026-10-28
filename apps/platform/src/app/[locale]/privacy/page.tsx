import { LegalPlaceholderView } from '@platform/components/features/sign-up/legal-placeholder-view';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('privacyTitle');
}

export default async function PrivacyPage() {
  const t = await getTranslations('legalPlaceholderPage');

  return (
    <LegalPlaceholderView
      title={t('privacyHeading')}
      description={t('privacyDescription')}
    />
  );
}
