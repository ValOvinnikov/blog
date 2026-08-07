import { ICONS, Size } from '@blog/config';
import { queries } from '@blog/db';
import { Icon } from '@blog/ui/atoms';
import { SettingRow, WindowChrome } from '@blog/ui/molecules';
import { DisplayNameControl } from '@web/components/shared/display-name-control';
import { ProviderLinkControl } from '@web/components/shared/provider-link-control';
import { auth } from '@web/server/auth/auth';
import { toSessionUsername } from '@web/utils/to-session-username';
import { getTranslations } from 'next-intl/server';

import { identitySectionVariants } from './identity-section-variants';

const s = identitySectionVariants();

/**
 * IdentitySection — the `/account` 6c "connected accounts / identity"
 * `WindowChrome` (#1159/#1162, D15 §4.6/6c). Reads its own session and
 * translations rather than receiving them as props from `AccountPage` — see
 * `PrivacySection`'s own docs for why. Fetches
 * `queries.account.getLinkedProviders` for the three sign-in methods this
 * repo ships (GitHub, Google, email magic link).
 *
 * Renders one `SettingRow` per method — composed directly from `SettingRow`/
 * `Icon` (no dedicated `packages/ui` organism, per #1161's scope
 * correction) — plus a fourth `SettingRow` for the display-name edit. Each
 * provider row's action slot shows a `ProviderLinkControl` ("link"/
 * "unlink"), except when that method is the reader's *last* remaining
 * linked one (computed here from the three booleans `getLinkedProviders`
 * returns) — then it's replaced with static italic text, matching the
 * mock's `.readonly` treatment, since removing it would lock the reader out
 * entirely. Email link never gets a "link" action (there's nothing to
 * initiate — it's tied to the account's own verified email) and never gets
 * an "unlink" action either (`queries.account.unlinkProvider`'s `provider`
 * type deliberately excludes it, per #1160) — so its action slot is either
 * the last-method notice or nothing at all.
 *
 * Per #1158's page-ordering decision, this always renders *above*
 * `NewsletterSection` (and therefore also above `PrivacySection`) in
 * `AccountPage`'s section list.
 */
export async function IdentitySection() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { id: userId, name, email, image } = session.user;
  const handle = toSessionUsername(name, email);
  const t = await getTranslations('accountPage.identity');

  const linked = await queries.account.getLinkedProviders(userId);
  const linkedCount = [linked.github, linked.google, linked.emailLink].filter(
    Boolean,
  ).length;
  const isLastMethod = (isLinked: boolean) => isLinked && linkedCount === 1;

  return (
    <WindowChrome>
      <WindowChrome.Bar>
        <WindowChrome.User>{handle}</WindowChrome.User>{' '}
        <WindowChrome.Prompt>{t('promptHost')}</WindowChrome.Prompt>{' '}
        {t('promptCommand')}
      </WindowChrome.Bar>
      <WindowChrome.Body>
        <SettingRow
          label={
            <>
              <Icon name={ICONS.GITHUB} size={Size.SM} /> {t('githubLabel')}{' '}
              <span
                className={
                  linked.github ? s.linkedStatus() : s.notLinkedStatus()
                }
              >
                {linked.github ? t('linkedStatus') : t('notLinkedStatus')}
              </span>
            </>
          }
        >
          {linked.github ? (
            isLastMethod(linked.github) ? (
              <span className={s.lastMethodNotice()}>
                {t('lastMethodNotice')}
              </span>
            ) : (
              <ProviderLinkControl provider="github" action="unlink" />
            )
          ) : (
            <ProviderLinkControl provider="github" action="link" />
          )}
        </SettingRow>
        <SettingRow
          label={
            <>
              <Icon name={ICONS.GOOGLE} size={Size.SM} /> {t('googleLabel')}{' '}
              <span
                className={
                  linked.google ? s.linkedStatus() : s.notLinkedStatus()
                }
              >
                {linked.google ? t('linkedStatus') : t('notLinkedStatus')}
              </span>
            </>
          }
        >
          {linked.google ? (
            isLastMethod(linked.google) ? (
              <span className={s.lastMethodNotice()}>
                {t('lastMethodNotice')}
              </span>
            ) : (
              <ProviderLinkControl provider="google" action="unlink" />
            )
          ) : (
            <ProviderLinkControl provider="google" action="link" />
          )}
        </SettingRow>
        <SettingRow
          label={
            <>
              <span className={s.emailIcon()} aria-hidden="true">
                ✉
              </span>{' '}
              {t('emailLinkLabel')}{' '}
              <span
                className={
                  linked.emailLink ? s.linkedStatus() : s.notLinkedStatus()
                }
              >
                {linked.emailLink ? t('linkedStatus') : t('notLinkedStatus')}
              </span>
            </>
          }
        >
          {isLastMethod(linked.emailLink) ? (
            <span className={s.lastMethodNotice()}>
              {t('lastMethodNotice')}
            </span>
          ) : null}
        </SettingRow>
        <SettingRow
          label={t('displayNameLabel')}
          description={t('displayNameDescription')}
        >
          <DisplayNameControl
            initialName={name ?? ''}
            email={email}
            image={image}
          />
        </SettingRow>
      </WindowChrome.Body>
    </WindowChrome>
  );
}
