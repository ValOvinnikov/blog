import type { ITenantLocalizedParams } from '@blog/config';
import { LandingPage } from '@web/components/pages/landing-page';
import { buildLandingPageMetadata } from '@web/metadata/landing-page-metadata';
import { enterDraftPreview } from '@web/server/draft-preview/enter-draft-preview/enter-draft-preview';
import type { Metadata } from 'next';

type TProps = {
  params: Promise<ITenantLocalizedParams & { slug: string[] }>;
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  await enterDraftPreview(params);
  const { slug } = await params;
  return buildLandingPageMetadata(slug.join('/'));
}

export default async function DraftLandingSlugPage({ params }: TProps) {
  const { slug } = await params;
  await enterDraftPreview(params);

  return <LandingPage path={slug.join('/')} />;
}
