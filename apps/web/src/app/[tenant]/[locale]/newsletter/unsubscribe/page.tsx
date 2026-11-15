import type { ITenantLocalizedParams } from '@shinefold/config';
import { NewsletterUnsubscribePage } from '@web/components/pages/newsletter-unsubscribe-page';
import { buildNewsletterUnsubscribeMetadata } from '@web/metadata/newsletter-unsubscribe-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import type { Metadata } from 'next';

type TProps = {
  params: Promise<ITenantLocalizedParams>;
};

export const revalidate = 86400;

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  await enterRequestContext(params);
  return buildNewsletterUnsubscribeMetadata();
}

export default async function NewsletterUnsubscribeRoute({ params }: TProps) {
  await enterRequestContext(params);

  return <NewsletterUnsubscribePage />;
}
