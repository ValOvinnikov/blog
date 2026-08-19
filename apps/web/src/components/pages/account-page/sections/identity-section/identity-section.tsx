import { ICONS, Size } from '@blog/config';
import { queries } from '@blog/db';
import { Heading, Icon } from '@blog/ui/atoms';
import { SettingRow, WindowChrome } from '@blog/ui/molecules';
import { DisplayNameControl } from '@web/components/shared/display-name-control';
import { PlainSection } from '@web/components/shared/plain-section';
import { ProviderLinkControl } from '@web/components/shared/provider-link-control';
import type { TLinkableProvider } from '@web/server/account/identity-actions';
import { auth } from '@web/server/auth/auth';
import { getChromeOn } from '@web/utils/get-chrome-on';
import { toSessionUsername } from '@web/utils/to-session-username';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import { identitySectionVariants } from './identity-section-variants';

const s = identitySectionVariants();

/**
 * IdentitySection — the `/account` "connected accounts / identity"
 * `WindowChrome`. The three provider rows (GitHub/Google/email-link) are
 * plain flex-row markup rather than `SettingRow`: that component's
 * label(heading)+description+control model doesn't fit a single-line
 * icon+name+status+action row, so each row wraps its name in its own
 * `Heading level={3}` directly to keep the heading-outline navigation
 * `SettingRow` would otherwise provide. Email link has no `link`/`unlink`
 * action (`provider: null`) since it's tied to the account's own verified
 * email, not a linkable OAuth provider. GitHub's `Icon` renders one `Size`
 * step larger than Google's/email's glyphs to read as visually equal —
 * the octocat SVG carries more internal padding than the others.
 */
export async function IdentitySection() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { id: userId, name, email, image } = session.user;
  const handle = toSessionUsername(name, email);
  const t = await getTranslations('accountPage.identity');

  const [linked, chromeOn] = await Promise.all([
    queries.account.getLinkedProviders(userId),
    getChromeOn(),
  ]);
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

  const bodyContent = (
    <>
      {providerRows.map(({ id, provider, icon, label, isLinked }) => (
        <div key={id} className={s.providerRow()}>
          <Heading level={3} visual="copy" className={s.providerName()}>
            {icon} {label}
          </Heading>
          <div className={s.providerStatus()}>
            {isLinked && (
              <span className={s.linkedStatus()}>{t('linkedStatus')}</span>
            )}
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
          </div>
        </div>
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
    </>
  );

  if (!chromeOn) {
    return (
      <PlainSection heading={t('promptCommand')} headingLevel={2}>
        {bodyContent}
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
      <WindowChrome.Body>{bodyContent}</WindowChrome.Body>
    </WindowChrome>
  );
}
