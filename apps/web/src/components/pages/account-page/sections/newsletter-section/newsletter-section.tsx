import { queries } from '@blog/db';
import { StatusBadge } from '@blog/ui/atoms';
import { SettingRow, WindowChrome } from '@blog/ui/molecules';
import { NewsletterSubscriptionControl } from '@web/components/shared/newsletter-subscription-control';
import { PlainSection } from '@web/components/shared/plain-section';
import { auth } from '@web/server/auth/auth';
import { getChromeOn } from '@web/utils/get-chrome-on';
import { toSessionUsername } from '@web/utils/to-session-username';
import { getTranslations } from 'next-intl/server';

import { newsletterSectionVariants } from './newsletter-section-variants';

const s = newsletterSectionVariants();

/**
 * NewsletterSection — the `/account` 6b "email & newsletter preferences"
 * `WindowChrome` (#1155/#1158, D15 §4.6/6b). Reads its own session and
 * translations rather than receiving them as props from `AccountPage` — see
 * `PrivacySection`'s own docs for why. Also reads
 * `queries.subscribers.getSubscriptionStatus` for the signed-in reader's
 * account email, since this section is the only one whose very presence on
 * the page depends on fetched data rather than always rendering once
 * authed.
 *
 * Renders **one** `SettingRow`, composed directly from `SettingRow`/
 * `StatusBadge`/`Button` (via `NewsletterSubscriptionControl`) — no
 * dedicated `packages/ui` organism, per #1158's scope correction — whose
 * label/badge/description/action switch on the `active`/`pending` outcome
 * (the mock's two panels are illustrative of the row's two states, not two
 * permanent rows). When the outcome is `not-subscribed`, this renders
 * nothing: managing an *existing* subscription is this section's whole job,
 * and there's no mocked "subscribe from here" affordance (that's the
 * separate `NewsletterForm` module, #1044/#1200).
 *
 * Per #1158's page-ordering decision, this always renders *above*
 * `PrivacySection` in `AccountPage`'s section list.
 */
export async function NewsletterSection() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { id: userId, name, email } = session.user;
  const [status, chromeOn] = await Promise.all([
    queries.subscribers.getSubscriptionStatus(userId),
    getChromeOn(),
  ]);

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
}
