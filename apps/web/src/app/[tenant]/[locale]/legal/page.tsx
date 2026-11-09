import type { ITenantLocalizedParams } from '@blog/config';
import { SectionIndexPage } from '@web/components/pages/section-index-page';
import { buildSectionIndexMetadata } from '@web/metadata/section-index-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import type { Metadata } from 'next';

type TProps = {
  params: Promise<ITenantLocalizedParams>;
};

/** Full Route Cache backstop for a missed purge — kept equal to `CONTENT_ROUTE_REVALIDATE_SECONDS` (Next requires a literal here, not an import). */
export const revalidate = 21600;

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  await enterRequestContext(params);
  return buildSectionIndexMetadata('page_legalIndex');
}

export default async function LegalIndexRoute({ params }: TProps) {
  await enterRequestContext(params);

  return <SectionIndexPage type="page_legalIndex" />;
}
