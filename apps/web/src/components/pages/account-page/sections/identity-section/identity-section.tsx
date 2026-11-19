import { ICONS, SIZE, type TMaybeNull } from '@shinefold/config';
import { OAUTH_PROVIDER } from '@shinefold/config/constants';
import { queries } from '@shinefold/db';
import { Icon } from '@shinefold/ui/components/atoms/icon';
import { DisplayNameControl } from '@web/components/shared/display-name-control';
import { ProviderLinkControl } from '@web/components/shared/provider-link-control';
import { PROVIDER_LINK_ACTION } from '@web/constants/provider-link';
import type { TLinkableProvider } from '@web/server/account/identity-actions/identity-actions';
import { auth } from '@web/server/auth/auth';
import { toSessionUsername } from '@web/utils/to-session-username';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import { identitySectionVariants } from './identity-section-variants';
import {
  IdentitySectionView,
  type IIdentityProviderRow,
} from './identity-section-view';

const s = identitySectionVariants();

export const IdentitySection = async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { id: userId, name, email, image } = session.user;
  const t = await getTranslations('accountPage.identity');

  const linked = await queries.account.getLinkedProviders(userId);
  const linkedCount = [linked.github, linked.google, linked.emailLink].filter(
    Boolean,
  ).length;
  const isLastMethod = (isLinked: boolean) => isLinked && linkedCount === 1;

  const providerConfigs: {
    id: 'github' | 'google' | 'email';
    provider: TMaybeNull<TLinkableProvider>;
    icon: ReactNode;
    label: string;
    isLinked: boolean;
  }[] = [
    {
      id: OAUTH_PROVIDER.GITHUB,
      provider: OAUTH_PROVIDER.GITHUB,
      // The octocat SVG carries more internal padding than the other glyphs, so it sits one SIZE step up.
      icon: <Icon name={ICONS.GITHUB} size={SIZE.MD} />,
      label: t('githubLabel'),
      isLinked: linked.github,
    },
    {
      id: OAUTH_PROVIDER.GOOGLE,
      provider: OAUTH_PROVIDER.GOOGLE,
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
          action={
            isLinked ? PROVIDER_LINK_ACTION.UNLINK : PROVIDER_LINK_ACTION.LINK
          }
        />
      ) : null,
    }),
  );

  return (
    <IdentitySectionView
      heading={t('heading')}
      providerRows={providerRows}
      displayNameLabel={t('displayNameLabel')}
      displayNameDescription={t('displayNameDescription')}
      displayNameControl={
        <DisplayNameControl
          initialName={name ?? toSessionUsername(name, email)}
          email={email}
          image={image}
        />
      }
    />
  );
};
