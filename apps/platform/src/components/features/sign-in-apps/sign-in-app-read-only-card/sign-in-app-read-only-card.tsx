import { SignInAppCallbackField } from '@platform/components/features/sign-in-apps/sign-in-app-callback-field';
import { SignInAppCallbackWarning } from '@platform/components/features/sign-in-apps/sign-in-app-callback-warning';
import { Card } from '@platform/components/shared/card';
import type { TSignInAppView } from '@platform/server/sign-in-apps/load-sign-in-apps';
import { useSignInAppCardHeader } from '@platform/utils/use-sign-in-app-card-header/use-sign-in-app-card-header';
import { useTranslations } from 'next-intl';

import { ReadOnlyCredentialBox } from './components/read-only-credential-box/read-only-credential-box';
import { signInAppReadOnlyCardVariants } from './sign-in-app-read-only-card-variants';

export type TSignInAppReadOnlyCardProps = {
  app: TSignInAppView;
  domain: string;
  isOperator: boolean;
};

export const SignInAppReadOnlyCard = ({
  app,
  domain,
  isOperator,
}: TSignInAppReadOnlyCardProps) => {
  const t = useTranslations('signInAppsPage');
  const {
    provider,
    hasOwnApp,
    callbackUrl,
    maskedClientId,
    hasCallbackWarning,
  } = app;
  const { body, fields } = signInAppReadOnlyCardVariants();
  const { header } = useSignInAppCardHeader(provider, hasOwnApp);

  return (
    <Card>
      <Card.Header {...header} />
      <Card.Body>
        <div className={body()}>
          {hasCallbackWarning && (
            <SignInAppCallbackWarning provider={provider} domain={domain} />
          )}
          <SignInAppCallbackField
            provider={provider}
            callbackUrl={callbackUrl}
          />
          {!isOperator && (
            <div className={fields()}>
              <ReadOnlyCredentialBox
                label={t('clientIdLabel')}
                value={maskedClientId ?? t('secretNotSet')}
                isMono={Boolean(maskedClientId)}
              />
              <ReadOnlyCredentialBox
                label={t('clientSecretLabel')}
                value={t(hasOwnApp ? 'secretSet' : 'secretNotSet')}
              />
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};
