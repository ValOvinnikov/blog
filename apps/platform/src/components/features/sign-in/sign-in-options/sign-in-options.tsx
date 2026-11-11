import type { TOAuthProviderId } from '@blog/auth/utils/oauth-providers/oauth-providers';
import { OAUTH_PROVIDER } from '@blog/config/constants';
import { hasLength } from '@blog/utils/primitives';
import { useTranslations } from 'next-intl';

import { EmailSignInForm } from './components/email-sign-in-form';
import { ProviderSignInButton } from './components/provider-sign-in-button';
import { signInOptionsVariants } from './sign-in-options-variants';

// Google leads: an owner signed up with Google accepts the Sanity editor invite with the same account in one click.
const PROVIDER_PRIORITY: readonly TOAuthProviderId[] = [
  OAUTH_PROVIDER.GOOGLE,
  OAUTH_PROVIDER.GITHUB,
];

const priorityOf = (id: TOAuthProviderId) => {
  const index = PROVIDER_PRIORITY.indexOf(id);

  return index === -1 ? PROVIDER_PRIORITY.length : index;
};

export type TSignInOptionsProps = {
  providerIds: readonly TOAuthProviderId[];
  callbackPath: string;
  isSignUp: boolean;
};

export const SignInOptions = ({
  providerIds,
  callbackPath,
  isSignUp,
}: TSignInOptionsProps) => {
  const t = useTranslations('signInOptions');
  const { root, providers, divider } = signInOptionsVariants();
  const orderedProviderIds = providerIds.toSorted(
    (a, b) => priorityOf(a) - priorityOf(b),
  );

  return (
    <div className={root()}>
      {hasLength(orderedProviderIds) && (
        <>
          <div className={providers()}>
            {orderedProviderIds.map((providerId) => (
              <ProviderSignInButton
                key={providerId}
                providerId={providerId}
                callbackPath={callbackPath}
                isSignUp={isSignUp}
              />
            ))}
          </div>
          <p className={divider()}>{t('or')}</p>
        </>
      )}
      <EmailSignInForm callbackPath={callbackPath} isSignUp={isSignUp} />
    </div>
  );
};
