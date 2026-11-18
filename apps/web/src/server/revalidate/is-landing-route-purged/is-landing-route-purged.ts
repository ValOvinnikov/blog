import { SANITY_WEBHOOK_OPERATION, type TMaybeNull } from '@shinefold/config';
import type { IRevalidateWebhookRedirect } from '@web/server/revalidate/is-revalidate-webhook-body/is-revalidate-webhook-body';

export type TLandingRoutePurgeInput = {
  type: string;
  operation: TMaybeNull<string>;
  redirect: IRevalidateWebhookRedirect;
};

export const isLandingRoutePurged = ({
  type,
  operation,
  redirect,
}: TLandingRoutePurgeInput): boolean =>
  // An older webhook sends no `isPrefix`, so only an explicit `false` marks an exact redirect.
  type === 'redirect'
    ? redirect.isPrefix !== false
    : type === 'page_landing' && operation === SANITY_WEBHOOK_OPERATION.DELETE;
