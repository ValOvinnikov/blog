import type { ITenantLocalizedParams } from '@blog/config';
import { NewsletterResultPage } from '@web/components/pages/newsletter-result-page';
import { buildNewsletterResultMetadata } from '@web/metadata/newsletter-result-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import { toNewsletterResult } from '@web/utils/to-newsletter-result';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

type TProps = {
  params: Promise<ITenantLocalizedParams & { result: string }>;
};

export function generateStaticParams() {
  return [];
}

/** Full Route Cache backstop for a missed purge — kept equal to `CONTENT_ROUTE_REVALIDATE_SECONDS` (Next requires a literal here, not an import). */
export const revalidate = 21600;

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  await enterRequestContext(params);
  const result = toNewsletterResult((await params).result);

  return result ? buildNewsletterResultMetadata(result) : {};
}

export default async function NewsletterResultRoute({ params }: TProps) {
  await enterRequestContext(params);
  const result = toNewsletterResult((await params).result);

  if (!result) {
    notFound();
  }

  return <NewsletterResultPage result={result} />;
}
