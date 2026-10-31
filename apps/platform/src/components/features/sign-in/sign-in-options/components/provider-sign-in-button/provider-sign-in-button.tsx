'use client';

import type { TOAuthProviderId } from '@blog/auth/utils/oauth-providers/oauth-providers';
import { ICONS } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import {
  Icon,
  type TRegisteredIconName,
} from '@platform/components/shared/icon';
import { ICON_SIZE } from '@platform/constants/icon';
import { signInWithProviderAction } from '@platform/server/auth/sign-in-with-provider-action';
import { tv } from '@platform/utils/tv/tv';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

const PROVIDERS = {
  github: { labelKey: 'continueWithGithub', icon: ICONS.GITHUB },
  google: { labelKey: 'continueWithGoogle', icon: ICONS.GOOGLE },
} as const satisfies Record<
  TOAuthProviderId,
  { labelKey: string; icon: TRegisteredIconName }
>;

const providerSignInButtonVariants = tv({
  base: ['w-full justify-center'],
});

export type TProviderSignInButtonProps = {
  providerId: TOAuthProviderId;
  callbackPath: string;
  isSignUp: boolean;
};

export const ProviderSignInButton = ({
  providerId,
  callbackPath,
  isSignUp,
}: TProviderSignInButtonProps) => {
  const t = useTranslations('providerSignInButton');
  const [isPending, startTransition] = useTransition();
  const { labelKey, icon } = PROVIDERS[providerId];

  const handleClick = () => {
    startTransition(() =>
      signInWithProviderAction({ providerId, callbackPath, isSignUp }),
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
      <Icon name={icon} size={ICON_SIZE.MD} />
      {t(labelKey)}
    </Button>
  );
};
