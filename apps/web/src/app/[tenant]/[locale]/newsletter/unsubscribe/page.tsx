import type { ITenantLocalizedParams } from '@blog/config';
import { NewsletterUnsubscribePage } from '@web/components/pages/newsletter-unsubscribe-page';
import { buildNewsletterUnsubscribeMetadata } from '@web/metadata/newsletter-unsubscribe-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

type TProps = {
  params: Promise<ITenantLocalizedParams>;
  searchParams: Promise<{ token?: string | string[] }>;
};

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  await enterRequestContext(params);
  return buildNewsletterUnsubscribeMetadata();
}

// The query-string token is a per-subscriber credential — never cacheable across readers.
export const dynamic = 'force-dynamic';

export default async function NewsletterUnsubscribeRoute({
  params,
  searchParams,
}: TProps) {
  await enterRequestContext(params);
  const { token } = await searchParams;

  if (typeof token !== 'string' || !token) {
    notFound();
  }

  return <NewsletterUnsubscribePage token={token} />;
}
