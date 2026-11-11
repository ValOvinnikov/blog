import {
  enterRequestContext,
  getRequestContext,
} from '@web/server/request-context/request-context';
import { notFound } from 'next/navigation';

type TRouteParams = { tenant: string; locale: string };

/** The draft route folder answers only a request the proxy routed to it with a verified token. */
export const enterDraftPreview = async (
  params: Promise<TRouteParams>,
): Promise<void> => {
  await enterRequestContext(params, { acceptsDraftPreview: true });
  const { isDraftPreview } = await getRequestContext();
  if (!isDraftPreview) {
    notFound();
  }
};
