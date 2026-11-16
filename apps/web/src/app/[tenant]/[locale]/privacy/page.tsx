import type { ITenantLocalizedParams } from '@shinefold/config';
import { SectionIndexPage } from '@web/components/pages/section-index-page';
import { buildSectionIndexMetadata } from '@web/metadata/section-index-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import type { Metadata } from 'next';

type TProps = {
  params: Promise<ITenantLocalizedParams>;
};

export const revalidate = 86400;

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  await enterRequestContext(params);
  return buildSectionIndexMetadata('page_privacyIndex');
}

export default async function PrivacyIndexRoute({ params }: TProps) {
  await enterRequestContext(params);

  return <SectionIndexPage type="page_privacyIndex" />;
}
