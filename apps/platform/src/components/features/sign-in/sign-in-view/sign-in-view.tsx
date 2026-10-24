import type { TOAuthProviderId } from '@blog/auth/utils/oauth-providers/oauth-providers';
import { ALERT_TYPE, type TMaybeUndefined } from '@blog/config';
import { PreShellFrame } from '@platform/components/features/layout/pre-shell-frame';
import { Alert } from '@platform/components/shared/alert';
import { BrandMark } from '@platform/components/shared/brand-mark';
import { PageHeader } from '@platform/components/shared/page-header';
import { SIGN_IN_ERROR, type TSignInError } from '@platform/constants/sign-in';
import { useTranslations } from 'next-intl';

import { EmailSignInForm } from './components/email-sign-in-form';
import { ProviderSignInButton } from './components/provider-sign-in-button';
import { signInViewVariants } from './sign-in-view-variants';

const SIGN_IN_ERROR_KEYS = {
  [SIGN_IN_ERROR.ACCOUNT_NOT_LINKED]: {
    title: 'accountNotLinkedTitle',
    description: 'accountNotLinkedDescription',
  },
  [SIGN_IN_ERROR.SIGN_IN_FAILED]: {
    title: 'signInFailedTitle',
    description: 'signInFailedDescription',
  },
} as const satisfies Record<
  TSignInError,
  { title: string; description: string }
>;

export type TSignInViewProps = {
  providerIds: readonly TOAuthProviderId[];
  callbackPath: string;
  error: TMaybeUndefined<TSignInError>;
};

export const SignInView = ({
  providerIds,
  callbackPath,
  error,
}: TSignInViewProps) => {
  const t = useTranslations('signInPage');
  const { content, providers } = signInViewVariants();

  return (
    <PreShellFrame
      header={
        <PageHeader
          title={t('heading')}
          description={t('description')}
          actions={<BrandMark title={t('brandMarkLabel')} />}
        />
      }
    >
      <div className={content()}>
        {error && (
          <Alert
            type={ALERT_TYPE.ERROR}
            title={t(SIGN_IN_ERROR_KEYS[error].title)}
            description={t(SIGN_IN_ERROR_KEYS[error].description)}
          />
        )}
        {providerIds.length > 0 && (
          <div className={providers()}>
            {providerIds.map((providerId) => (
              <ProviderSignInButton
                key={providerId}
                providerId={providerId}
                callbackPath={callbackPath}
              />
            ))}
          </div>
        )}
        <EmailSignInForm callbackPath={callbackPath} />
      </div>
    </PreShellFrame>
  );
};
