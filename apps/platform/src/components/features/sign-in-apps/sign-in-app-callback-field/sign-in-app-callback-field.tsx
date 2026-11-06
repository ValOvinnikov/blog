'use client';

import type { TOAuthProvider } from '@blog/config/constants';
import { CopyCallbackButton } from '@platform/components/features/sign-in-apps/copy-callback-button';
import { ExternalLink } from '@platform/components/shared/external-link';
import { FormField } from '@platform/components/shared/form-field';
import { OAUTH_PROVIDER_CONSOLE_URL } from '@platform/constants/sign-in-apps';
import { useTranslations } from 'next-intl';
import type { Ref } from 'react';

import { signInAppCallbackFieldVariants } from './sign-in-app-callback-field-variants';

export type TSignInAppCallbackFieldProps = {
  provider: TOAuthProvider;
  callbackUrl: string;
  hasConsoleLink?: boolean;
  copyRef?: Ref<HTMLButtonElement>;
};

export const SignInAppCallbackField = ({
  provider,
  callbackUrl,
  hasConsoleLink = false,
  copyRef,
}: TSignInAppCallbackFieldProps) => {
  const t = useTranslations('signInAppsPage');
  const tProvider = useTranslations('signInAppsPage.providerName');
  const { hint, consoleLink, row, value } = signInAppCallbackFieldVariants();
  const providerName = tProvider(provider);

  return (
    <FormField
      label={t('callbackLabel')}
      hint={
        <span className={hint()}>
          {t('callbackHint', { provider: providerName })}
          {hasConsoleLink && (
            <ExternalLink
              href={OAUTH_PROVIDER_CONSOLE_URL[provider]}
              className={consoleLink()}
            >
              {t(`consoleLink.${provider}`)}
            </ExternalLink>
          )}
        </span>
      }
      control={{ hasOwnAccessibleName: true }}
    >
      <div className={row()}>
        <span className={value()}>{callbackUrl}</span>
        <CopyCallbackButton value={callbackUrl} ref={copyRef} />
      </div>
    </FormField>
  );
};
