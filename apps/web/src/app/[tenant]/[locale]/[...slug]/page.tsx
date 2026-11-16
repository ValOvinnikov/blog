import type { ITenantLocalizedParams } from '@shinefold/config';
import { LandingPage } from '@web/components/pages/landing-page';
import { buildLandingPageMetadata } from '@web/metadata/landing-page-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import type { Metadata } from 'next';

type TProps = {
  params: Promise<ITenantLocalizedParams & { slug: string[] }>;
};

export function generateStaticParams() {
  return [];
}

export const revalidate = 86400;

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  await enterRequestContext(params);
  const { slug } = await params;
  return buildLandingPageMetadata(slug.join('/'));
}

export default async function LandingSlugPage({ params }: TProps) {
  const { slug } = await params;
  await enterRequestContext(params);

  return <LandingPage path={slug.join('/')} />;
}
