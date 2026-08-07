import { ICONS, Size } from '@blog/config';
import { queries } from '@blog/db';
import { Icon } from '@blog/ui/atoms';
import { SettingRow, WindowChrome } from '@blog/ui/molecules';
import { DisplayNameControl } from '@web/components/shared/display-name-control';
import { ProviderLinkControl } from '@web/components/shared/provider-link-control';
import type { TLinkableProvider } from '@web/server/account/identity-actions';
import { auth } from '@web/server/auth/auth';
import { toSessionUsername } from '@web/utils/to-session-username';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

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
 * correction) — plus a fourth `SettingRow` for the display-name edit. The
 * three provider rows are driven from a local `providerRows` array + `.map()`
 * (#1225) rather than three copy-pasted `SettingRow` blocks, since they only
 * differ in icon, label copy, current linked state, and whether a
 * link/unlink control is even possible (`provider: null` for email — see
 * below). Each row's `label` renders as two explicit stacked lines — icon +
 * provider name, then the linked/not-linked status on its own line (a
 * `basis-full` span forces the wrap unconditionally, not just when the
 * inline group happens to run out of room, #1225) — and its action slot
 * shows a `ProviderLinkControl` ("link"/"unlink"), except when that method
 * is the reader's *last* remaining linked one (computed here from the three
 * booleans `getLinkedProviders` returns) — then it's replaced with static
 * italic text, matching the mock's `.readonly` treatment, since removing it
 * would lock the reader out entirely. Email link never gets a "link" action
 * (there's nothing to initiate — it's tied to the account's own verified
 * email) and never gets an "unlink" action either
 * (`queries.account.unlinkProvider`'s `provider` type deliberately excludes
 * it, per #1160), so its row config carries `provider: null` and its action
 * slot is either the last-method notice or nothing at all. GitHub's `Icon`
 * renders one `Size` step larger than Google's (#1225) — the octocat glyph
 * has more internal padding baked into its source SVG than Google's "G",
 * which fills its viewBox edge-to-edge, so matching `size` props alone read
 * visibly smaller; the email glyph gets a matching `text-lg` bump for the
 * same reason.
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

  const providerRows: {
    id: 'github' | 'google' | 'email';
    provider: TLinkableProvider | null;
    icon: ReactNode;
    label: string;
    isLinked: boolean;
  }[] = [
    {
      id: 'github',
      provider: 'github',
      icon: <Icon name={ICONS.GITHUB} size={Size.MD} />,
      label: t('githubLabel'),
      isLinked: linked.github,
    },
    {
      id: 'google',
      provider: 'google',
      icon: <Icon name={ICONS.GOOGLE} size={Size.SM} />,
      label: t('googleLabel'),
      isLinked: linked.google,
    },
    {
      id: 'email',
      provider: null,
      icon: (
        <span className={s.emailIcon()} aria-hidden="true">
          ✉
        </span>
      ),
      label: t('emailLinkLabel'),
      isLinked: linked.emailLink,
    },
  ];

  return (
    <WindowChrome>
      <WindowChrome.Bar>
        <WindowChrome.User>{handle}</WindowChrome.User>{' '}
        <WindowChrome.Prompt>{t('promptHost')}</WindowChrome.Prompt>{' '}
        {t('promptCommand')}
      </WindowChrome.Bar>
      <WindowChrome.Body>
        {providerRows.map(({ id, provider, icon, label, isLinked }) => (
          <SettingRow
            key={id}
            label={
              <>
                <span className={s.providerName()}>
                  {icon} {label}
                </span>
                <span className={s.providerStatusRow()}>
                  <span
                    className={
                      isLinked ? s.linkedStatus() : s.notLinkedStatus()
                    }
                  >
                    {isLinked ? t('linkedStatus') : t('notLinkedStatus')}
                  </span>
                </span>
              </>
            }
          >
            {isLastMethod(isLinked) ? (
              <span className={s.lastMethodNotice()}>
                {t('lastMethodNotice')}
              </span>
            ) : provider ? (
              <ProviderLinkControl
                provider={provider}
                action={isLinked ? 'unlink' : 'link'}
              />
            ) : null}
          </SettingRow>
        ))}
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
