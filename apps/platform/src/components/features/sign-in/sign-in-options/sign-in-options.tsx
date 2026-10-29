import type { TOAuthProviderId } from '@blog/auth/utils/oauth-providers/oauth-providers';
import { useTranslations } from 'next-intl';

import { EmailSignInForm } from './components/email-sign-in-form';
import { ProviderSignInButton } from './components/provider-sign-in-button';
import { signInOptionsVariants } from './sign-in-options-variants';

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

  return (
    <div className={root()}>
      {providerIds.length > 0 && (
        <>
          <div className={providers()}>
            {providerIds.map((providerId) => (
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
