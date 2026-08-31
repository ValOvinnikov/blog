import { ICONS, SIZE } from '@blog/config';
import { queries } from '@blog/db';
import { Icon } from '@blog/ui/atoms/icon';
import { DisplayNameControl } from '@web/components/shared/display-name-control';
import { ProviderLinkControl } from '@web/components/shared/provider-link-control';
import type { TLinkableProvider } from '@web/server/account/identity-actions';
import { auth } from '@web/server/auth/auth';
import { getChromeOn } from '@web/utils/get-chrome-on';
import { toSessionUsername } from '@web/utils/to-session-username';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import { identitySectionVariants } from './identity-section-variants';
import {
  IdentitySectionView,
  type IIdentityProviderRow,
} from './identity-section-view';

const s = identitySectionVariants();

/**
 * IdentitySection — the `/account` "connected accounts / identity" wrapper.
 * Provider rows render as plain flex-row markup rather than `SettingRow`
 * (its label+description+control model doesn't fit a single-line
 * icon+name+status+action row). GitHub's `Icon` renders one `SIZE` step
 * larger than Google's/email's glyphs since the octocat SVG carries more
 * internal padding than the others.
 */
export const IdentitySection = async () => {
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

  const providerConfigs: {
    id: 'github' | 'google' | 'email';
    provider: TLinkableProvider | null;
    icon: ReactNode;
    label: string;
    isLinked: boolean;
  }[] = [
    {
      id: 'github',
      provider: 'github',
      icon: <Icon name={ICONS.GITHUB} size={SIZE.MD} />,
      label: t('githubLabel'),
      isLinked: linked.github,
    },
    {
      id: 'google',
      provider: 'google',
      icon: <Icon name={ICONS.GOOGLE} size={SIZE.SM} />,
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

  const providerRows: IIdentityProviderRow[] = providerConfigs.map(
    ({ id, provider, icon, label, isLinked }) => ({
      id,
      icon,
      label,
      isLinked,
      isLastMethod: isLastMethod(isLinked),
      linkedStatusLabel: t('linkedStatus'),
      lastMethodNoticeLabel: t('lastMethodNotice'),
      control: provider ? (
        <ProviderLinkControl
          provider={provider}
          action={isLinked ? 'unlink' : 'link'}
        />
      ) : null,
    }),
  );

  return (
    <IdentitySectionView
      isChromeOn={chromeOn}
      handle={handle}
      promptHost={t('promptHost')}
      promptCommand={t('promptCommand')}
      providerRows={providerRows}
      displayNameLabel={t('displayNameLabel')}
      displayNameDescription={t('displayNameDescription')}
      displayNameControl={
        <DisplayNameControl
          initialName={name ?? ''}
          email={email}
          image={image}
        />
      }
    />
  );
};
