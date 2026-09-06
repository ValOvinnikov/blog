import { queries } from '@blog/db';
import { NewsletterSubscriptionControl } from '@web/components/shared/newsletter-subscription-control';
import { auth } from '@web/server/auth/auth';
import { getRequestTenantId } from '@web/server/tenant/get-request-tenant-id';
import { getTranslations } from 'next-intl/server';

import { NewsletterSectionView } from './newsletter-section-view';

export const NewsletterSection = async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { id: userId, email } = session.user;

  const tenantId = await getRequestTenantId();
  if (!tenantId) return null;

  const status = await queries.subscribers.getSubscriptionStatus(
    tenantId,
    userId,
  );

  // Subscribing is a separate `NewsletterForm` module's job — this
  // section only ever manages an existing subscription.
  if (status.outcome === 'not-subscribed') return null;

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
          action={status.outcome === 'active' ? 'unsubscribe' : 'resend'}
        />
      }
    />
  );
};
