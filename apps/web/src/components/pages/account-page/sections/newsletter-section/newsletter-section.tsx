import { SUBSCRIBER_OUTCOME } from '@blog/config';
import { queries } from '@blog/db';
import { SUBSCRIBER_STATUS } from '@blog/db/constants';
import { NewsletterSubscriptionControl } from '@web/components/shared/newsletter-subscription-control';
import { NEWSLETTER_SUBSCRIPTION_ACTION } from '@web/constants/newsletter';
import { auth } from '@web/server/auth/auth';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getTranslations } from 'next-intl/server';

import { NewsletterSectionView } from './newsletter-section-view';

export const NewsletterSection = async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { id: userId, email } = session.user;

  const { tenantId } = await getRequestContext();
  if (!tenantId) return null;

  const status = await queries.subscribers.getSubscriptionStatus(
    tenantId,
    userId,
  );

  // Subscribing is a separate `NewsletterForm` module's job — this
  // section only ever manages an existing subscription.
  if (status.outcome === SUBSCRIBER_OUTCOME.NOT_SUBSCRIBED) return null;

  const t = await getTranslations('accountPage.newsletter');

  return (
    <NewsletterSectionView
      heading={t('heading')}
      status={status.outcome}
      label={t('label')}
      email={email ?? ''}
      activeBadgeLabel={t('activeBadge')}
      activeDescriptionPrefix={t('activeDescriptionPrefix')}
      activeDescriptionSuffix={t('activeDescriptionSuffix')}
      pendingBadgeLabel={t('pendingBadge')}
      pendingDescription={t('pendingDescription')}
      control={
        <NewsletterSubscriptionControl
          action={
            status.outcome === SUBSCRIBER_STATUS.ACTIVE
              ? NEWSLETTER_SUBSCRIPTION_ACTION.UNSUBSCRIBE
              : NEWSLETTER_SUBSCRIPTION_ACTION.RESEND
          }
        />
      }
    />
  );
};
