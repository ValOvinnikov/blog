'use client';

import type { TOAuthProviderId } from '@blog/auth/utils/oauth-providers/oauth-providers';
import { Button } from '@platform/components/shared/button';
import { signInWithProviderAction } from '@platform/server/auth/sign-in-with-provider-action';
import { tv } from '@platform/utils/tv/tv';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

const PROVIDER_LABEL_KEYS = {
  github: 'continueWithGithub',
  google: 'continueWithGoogle',
} as const satisfies Record<TOAuthProviderId, string>;

const providerSignInButtonVariants = tv({
  base: ['w-full justify-center'],
});

export type TProviderSignInButtonProps = {
  providerId: TOAuthProviderId;
  callbackPath: string;
};

export const ProviderSignInButton = ({
  providerId,
  callbackPath,
}: TProviderSignInButtonProps) => {
  const t = useTranslations('signInPage');
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(() =>
      signInWithProviderAction({ providerId, callbackPath }),
    );
  };

  return (
    <Button
      variant="secondary"
      isPending={isPending}
      pendingLabel={t('redirecting')}
      onClick={handleClick}
      className={providerSignInButtonVariants()}
    >
      {t(PROVIDER_LABEL_KEYS[providerId])}
    </Button>
  );
};
