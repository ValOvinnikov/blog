'use client';

import { ACTION_OUTCOME, routes } from '@shinefold/config';
import type { TValueOf } from '@shinefold/config/utils';
import { Button } from '@shinefold/ui/components/atoms/button';
import { PROVIDER_LINK_ACTION } from '@web/constants/provider-link';
import { useBusyStyle } from '@web/context/busy-style-provider';
import { useActionToast } from '@web/hooks/use-action-toast';
import {
  unlinkProviderAction,
  type TLinkableProvider,
} from '@web/server/account/identity-actions/identity-actions';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

export type TProviderLinkControlProps = {
  provider: TLinkableProvider;
  action: TValueOf<typeof PROVIDER_LINK_ACTION>;
};

// signIn(provider) from an already-authenticated session links the provider to that account instead of signing in afresh.
export const ProviderLinkControl = ({
  provider,
  action,
}: TProviderLinkControlProps) => {
  const t = useTranslations('accountPage.identity');
  const { busyStyle, spinnerVariant } = useBusyStyle();
  const { isPending, run } = useActionToast();
  const [isLinkPending, startTransition] = useTransition();

  const isLink = action === PROVIDER_LINK_ACTION.LINK;

  const handleLink = () => {
    startTransition(async () => {
      await signIn(provider, { redirectTo: routes.account() });
    });
  };

  const handleUnlink = () => {
    run(() => unlinkProviderAction(provider), {
      loading: t('unlinkToastLoadingMessage'),
      success: t('unlinkToastSuccessMessage'),
      error: t('unlinkError'),
      errorByOutcome: { [ACTION_OUTCOME.BLOCKED]: t('unlinkLastMethodError') },
    });
  };

  return (
    <Button
      variant="ghost"
      isBusy={isPending || isLinkPending}
      busyLabel={isLink ? undefined : t('unlinkingLabel')}
      busyStyle={busyStyle}
      spinnerVariant={spinnerVariant}
      onClick={isLink ? handleLink : handleUnlink}
    >
      {isLink ? t('linkButton') : t('unlinkButton')}
    </Button>
  );
};
