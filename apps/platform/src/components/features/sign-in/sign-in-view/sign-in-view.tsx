import type { TOAuthProviderId } from '@blog/auth/utils/oauth-providers/oauth-providers';
import { ALERT_TYPE, type TMaybeUndefined } from '@blog/config';
import { CenteredCardFrame } from '@platform/components/features/layout/centered-card-frame';
import { SignInOptions } from '@platform/components/features/sign-in/sign-in-options';
import { Alert } from '@platform/components/shared/alert';
import { Heading } from '@platform/components/shared/heading';
import { Text } from '@platform/components/shared/text';
import { TextLink } from '@platform/components/shared/text-link';
import { SIGN_IN_ERROR, type TSignInError } from '@platform/constants/sign-in';
import { adminRoutes } from '@platform/utils/routes/routes';
import { useTranslations } from 'next-intl';

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
  const { content, copy, footer } = signInViewVariants();

  return (
    <CenteredCardFrame
      footer={
        <Text variant="hint" className={footer()}>
          {t.rich('signUpPrompt', {
            link: (chunks) => (
              <TextLink href={adminRoutes.signUp()}>{chunks}</TextLink>
            ),
          })}
        </Text>
      }
    >
      <div className={content()}>
        <div className={copy()}>
          <Heading level={1} size="pageTitle">
            {t('heading')}
          </Heading>
          <Text variant="supporting">{t('description')}</Text>
        </div>
        {error && (
          <Alert
            type={ALERT_TYPE.ERROR}
            title={t(SIGN_IN_ERROR_KEYS[error].title)}
            description={t(SIGN_IN_ERROR_KEYS[error].description)}
          />
        )}
        <SignInOptions
          providerIds={providerIds}
          callbackPath={callbackPath}
          isSignUp={false}
        />
      </div>
    </CenteredCardFrame>
  );
};
