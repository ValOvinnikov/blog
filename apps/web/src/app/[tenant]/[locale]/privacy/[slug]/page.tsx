import type { ITenantLocalizedParams } from '@blog/config';
import { SectionDocumentPage } from '@web/components/pages/section-document-page';
import { buildSectionDocumentMetadata } from '@web/metadata/section-document-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import type { Metadata } from 'next';

type TProps = {
  params: Promise<ITenantLocalizedParams & { slug: string }>;
};

export function generateStaticParams() {
  return [];
}

/** Full Route Cache backstop for a missed purge — kept equal to `CONTENT_ROUTE_REVALIDATE_SECONDS` (Next requires a literal here, not an import). */
export const revalidate = 21600;

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  await enterRequestContext(params);
  const { slug } = await params;
  return buildSectionDocumentMetadata('page_privacyDocument', slug);
}

export default async function PrivacyDocumentPage({ params }: TProps) {
  const { slug } = await params;
  await enterRequestContext(params);

  return <SectionDocumentPage type="page_privacyDocument" slug={slug} />;
}
