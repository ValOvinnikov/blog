import { routes } from '@blog/config';
import { queries, type schema } from '@blog/db';
import { buildNewsletterConfirmationEmail, sendEmail } from '@blog/email';
import { mintNewsletterUnsubscribeToken } from '@web/server/newsletter/newsletter-unsubscribe-token/newsletter-unsubscribe-token';
import { resolveNewsletterEmailSettings } from '@web/server/newsletter/resolve-newsletter-email-settings/resolve-newsletter-email-settings';
import { getSubscribedPageLocale } from '@web/server/newsletter/subscribed-page-locale/subscribed-page-locale';
import { getTenantBaseUrl } from '@web/server/tenant/tenant-base-url/tenant-base-url';
import { env } from '@web/utils/env/env';
import { resolveTenantEmailIdentity } from '@web/utils/resolve-tenant-email-identity';

const CONFIRMATION_RESEND_COOLDOWN_MS = 15 * 60_000;

interface IConfirmationRecipient {
  subscriberId: string;
  email: string;
}

const sendConfirmationEmail = async (
  tenantId: string,
  { subscriberId, email }: IConfirmationRecipient,
  confirmationToken: string,
): Promise<void> => {
  const siteUrl = (await getTenantBaseUrl()) ?? '';
  const locale = await getSubscribedPageLocale();
  const unsubscribeToken = mintNewsletterUnsubscribeToken(subscriberId);
  const confirmationUrl = `${siteUrl}${routes.newsletterConfirm(confirmationToken, locale)}`;
  const unsubscribeUrl = `${siteUrl}${routes.newsletterUnsubscribe(unsubscribeToken, locale)}`;
  const { brand, brandName } = await resolveTenantEmailIdentity(tenantId);

  const {
    subject,
    body,
    logoImageUrl,
    footerPostalAddress,
    fromAddress,
    replyTo,
  } = await resolveNewsletterEmailSettings(
    tenantId,
    env.NEWSLETTER_FROM_ADDRESS,
    locale,
  );

  const { html, headers } = buildNewsletterConfirmationEmail({
    subject,
    body,
    confirmationUrl,
    unsubscribeUrl,
    brand,
    brandName,
    logoImageUrl,
    footerPostalAddress,
  });

  await sendEmail({
    to: email,
    from: fromAddress,
    subject,
    html,
    headers,
    replyTo,
  });
};

// The token is stored only after the send, so a failed send leaves the previous confirm link working.
export const deliverNewsletterConfirmation = async (
  tenantId: string,
  recipient: IConfirmationRecipient,
  confirmationToken: string,
): Promise<void> => {
  await sendConfirmationEmail(tenantId, recipient, confirmationToken);
  await queries.subscribers.commitConfirmationToken(
    recipient.subscriberId,
    confirmationToken,
  );
};

export const sendNewsletterConfirmation = async (
  tenantId: string,
  subscriber: schema.TSubscriber,
): Promise<void> => {
  const { id, email } = subscriber;
  const claim = await queries.subscribers.claimConfirmationSend(
    id,
    CONFIRMATION_RESEND_COOLDOWN_MS,
  );
  if (!claim) return;

  const { claimedAt, confirmationToken } = claim;
  try {
    await deliverNewsletterConfirmation(
      tenantId,
      { subscriberId: id, email },
      confirmationToken,
    );
  } catch (error) {
    await queries.subscribers.releaseConfirmationSend(id, claimedAt);
    throw error;
  }
};
