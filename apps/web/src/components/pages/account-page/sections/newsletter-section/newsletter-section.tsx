import { queries } from '@blog/db';
import { StatusBadge } from '@blog/ui/atoms';
import { SettingRow, WindowChrome } from '@blog/ui/molecules';
import { NewsletterSubscriptionControl } from '@web/components/shared/newsletter-subscription-control';
import { PlainSection } from '@web/components/shared/plain-section';
import { auth } from '@web/server/auth/auth';
import { getRequestTenantId } from '@web/server/tenant/get-request-tenant-id';
import { getChromeOn } from '@web/utils/get-chrome-on';
import { toSessionUsername } from '@web/utils/to-session-username';
import { getTranslations } from 'next-intl/server';

import { newsletterSectionVariants } from './newsletter-section-variants';

const s = newsletterSectionVariants();

/**
 * The `/account` "email & newsletter preferences" `WindowChrome`. Reads its
 * own session and translations rather than receiving them as props from
 * `AccountPage` — see `PrivacySection`'s own docs for why. Also reads
 * `queries.subscribers.getSubscriptionStatus`, since this section is the
 * only one whose very presence on the page depends on fetched data rather
 * than always rendering once authed.
 *
 * Renders **one** `SettingRow` whose label/badge/description/action switch
 * on the `active`/`pending` outcome. When the outcome is `not-subscribed`,
 * this renders nothing: managing an *existing* subscription is this
 * section's whole job — subscribing is the separate `NewsletterForm`
 * module's job.
 */
export const NewsletterSection = async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { id: userId, name, email } = session.user;

  const [tenantId, chromeOn] = await Promise.all([
    getRequestTenantId(),
    getChromeOn(),
  ]);
  if (!tenantId) return null;

  const status = await queries.subscribers.getSubscriptionStatus(
    tenantId,
    userId,
  );

  if (status.outcome === 'not-subscribed') return null;

  const handle = toSessionUsername(name, email);
  const t = await getTranslations('accountPage.newsletter');

  const settingRow =
    status.outcome === 'active' ? (
      <SettingRow
        label={
          <>
            {t('label')} <StatusBadge tone="ok">{t('activeBadge')}</StatusBadge>
          </>
        }
        description={
          <>
            {t('activeDescriptionPrefix')}{' '}
            <span className={s.email()}>{email}</span>{' '}
            {t('activeDescriptionSuffix')}
          </>
        }
      >
        <NewsletterSubscriptionControl action="unsubscribe" />
      </SettingRow>
    ) : (
      <SettingRow
        label={
          <>
            {t('label')}{' '}
            <StatusBadge tone="warn">{t('pendingBadge')}</StatusBadge>
          </>
        }
        description={t('pendingDescription')}
      >
        <NewsletterSubscriptionControl action="resend" />
      </SettingRow>
    );

  if (!chromeOn) {
    return (
      <PlainSection heading={t('promptCommand')} headingLevel={2}>
        {settingRow}
      </PlainSection>
    );
  }

  return (
    <WindowChrome>
      <WindowChrome.Bar headingLevel={2}>
        <WindowChrome.User>{handle}</WindowChrome.User>{' '}
        <WindowChrome.Prompt>{t('promptHost')}</WindowChrome.Prompt>{' '}
        {t('promptCommand')}
      </WindowChrome.Bar>
      <WindowChrome.Body>{settingRow}</WindowChrome.Body>
    </WindowChrome>
  );
};
