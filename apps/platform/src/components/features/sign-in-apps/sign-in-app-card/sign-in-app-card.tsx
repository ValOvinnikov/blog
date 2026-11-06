'use client';

import { SignInAppCallbackField } from '@platform/components/features/sign-in-apps/sign-in-app-callback-field';
import { SignInAppCallbackWarning } from '@platform/components/features/sign-in-apps/sign-in-app-callback-warning';
import { SignInAppStatusBadge } from '@platform/components/features/sign-in-apps/sign-in-app-status-badge';
import { SignInAppTitle } from '@platform/components/features/sign-in-apps/sign-in-app-title';
import { Card } from '@platform/components/shared/card';
import type { TSignInAppView } from '@platform/server/sign-in-apps/load-sign-in-apps';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import { ClientIdField } from './components/client-id-field/client-id-field';
import { ClientSecretField } from './components/client-secret-field/client-secret-field';
import { SignInAppCardFooter } from './components/sign-in-app-card-footer/sign-in-app-card-footer';
import { signInAppCardVariants } from './sign-in-app-card-variants';
import { useSignInAppForm } from './use-sign-in-app-form';

export type TSignInAppCardProps = {
  tenantId: string;
  app: TSignInAppView;
  domain: string;
};

export const SignInAppCard = ({
  tenantId,
  app,
  domain,
}: TSignInAppCardProps) => {
  const t = useTranslations('signInAppsPage');
  const form = useSignInAppForm(tenantId, app);
  const { provider, saved, savedMessage, clearApp } = form;
  const [isCallbackConfirmed, setIsCallbackConfirmed] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const copyRef = useRef<HTMLButtonElement>(null);
  const providerName = t(`providerName.${provider}`);
  const hasCallbackWarning =
    app.hasCallbackWarning &&
    saved.hasOwnApp &&
    !isCallbackConfirmed &&
    !savedMessage;
  const { body, fields } = signInAppCardVariants();

  const handleRemoved = () => {
    clearApp();
    titleRef.current?.focus();
  };

  const handleCallbackConfirmed = () => {
    setIsCallbackConfirmed(true);
    copyRef.current?.focus();
  };

  return (
    <Card>
      <Card.Header
        title={<SignInAppTitle provider={provider} />}
        titleRef={titleRef}
        titleTabIndex={-1}
        supportingText={t(
          saved.hasOwnApp ? 'ownDescription' : 'sharedDescription',
          { provider: providerName },
        )}
        actions={<SignInAppStatusBadge hasOwnApp={saved.hasOwnApp} />}
      />
      <Card.Body>
        <div className={body()}>
          {hasCallbackWarning && (
            <SignInAppCallbackWarning
              provider={provider}
              domain={domain}
              confirm={{ tenantId, onConfirmed: handleCallbackConfirmed }}
            />
          )}
          <SignInAppCallbackField
            provider={provider}
            callbackUrl={app.callbackUrl}
            hasConsoleLink={!saved.hasOwnApp}
            copyRef={copyRef}
          />
          <div className={fields()}>
            <ClientIdField providerName={providerName} fields={form} />
            <ClientSecretField fields={form} />
          </div>
        </div>
      </Card.Body>
      <SignInAppCardFooter
        tenantId={tenantId}
        form={form}
        onRemoved={handleRemoved}
      />
    </Card>
  );
};
