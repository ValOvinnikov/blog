import { routes } from '@blog/config';
import {
  buildPostEmail,
  buildSiteEmailTag,
  EMAIL_ACCOUNT,
  type TSendEmailInput,
} from '@blog/email';
import { signNewsletterUnsubscribeToken } from '@blog/utils/newsletter-unsubscribe-token';
import type { TNewsletterSendContext } from '@worker/utils/newsletter-send/newsletter-send-context';
import type { TNewsletterPost } from '@worker/utils/newsletter-send/read-newsletter-post';

export type TPostSendTarget = {
  tenantId: string;
  postId: string;
  subscriberId: string;
  email: string;
};

export function buildPostSend(
  context: TNewsletterSendContext,
  post: TNewsletterPost,
  { tenantId, postId, subscriberId, email }: TPostSendTarget,
): TSendEmailInput {
  const { siteUrl, locale, from, replyTo, unsubscribeKey, ...brand } = context;
  const { title, excerpt, slug, coverImageUrl, takeaways } = post;
  const unsubscribeToken = signNewsletterUnsubscribeToken(
    subscriberId,
    unsubscribeKey,
  );

  const { subject, html, text, headers } = buildPostEmail({
    subject: title,
    title,
    excerpt,
    postUrl: `${siteUrl}${routes.post(slug)}`,
    unsubscribeUrl: `${siteUrl}${routes.newsletterUnsubscribe(unsubscribeToken, locale)}`,
    coverImageUrl,
    takeaways,
    ...brand,
  });

  return {
    account: EMAIL_ACCOUNT.TENANT,
    to: email,
    from,
    replyTo,
    subject,
    html,
    text,
    headers,
    tags: [buildSiteEmailTag(tenantId)],
    idempotencyKey: `newsletter-post/${tenantId}/${postId}/${subscriberId}`,
  };
}
