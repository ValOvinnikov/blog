'use client';

import { ACTION_OUTCOME, routes } from '@blog/config';
import { Button } from '@blog/ui/components/atoms/button';
import { useBusyStyle } from '@web/context/busy-style-provider';
import { useToast } from '@web/context/toast-provider';
import {
  unlinkProviderAction,
  type TLinkableProvider,
} from '@web/server/account/identity-actions/identity-actions';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

export type TProviderLinkControlProps = {
  provider: TLinkableProvider;
  action: 'link' | 'unlink';
};

// signIn(provider) from an already-authenticated session links the provider to that account instead of signing in afresh.
export const ProviderLinkControl = ({
  provider,
  action,
}: TProviderLinkControlProps) => {
  const t = useTranslations('accountPage.identity');
  const { busyStyle, spinnerVariant } = useBusyStyle();
  const toast = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isLink = action === 'link';

  const handleLink = () => {
    startTransition(async () => {
      await signIn(provider, { redirectTo: routes.account() });
    });
  };

  const handleUnlink = () => {
    startTransition(async () => {
      try {
        await toast.promise(
          (async () => {
            const result = await unlinkProviderAction(provider);
            if (result.outcome !== ACTION_OUTCOME.SUCCESS) {
              throw new Error(result.outcome);
            }
            return result;
          })(),
          {
            loading: { message: t('unlinkToastLoadingMessage') },
            success: { message: t('unlinkToastSuccessMessage') },
            error: (error: unknown) => ({
              message:
                error instanceof Error &&
                error.message === ACTION_OUTCOME.BLOCKED
                  ? t('unlinkLastMethodError')
                  : t('unlinkError'),
            }),
          },
        );
      } catch {
        return;
      }

      router.refresh();
    });
  };

  return (
    <Button
      variant="ghost"
      isBusy={isPending}
      busyLabel={isLink ? undefined : t('unlinkingLabel')}
      busyStyle={busyStyle}
      spinnerVariant={spinnerVariant}
      onClick={isLink ? handleLink : handleUnlink}
    >
      {isLink ? t('linkButton') : t('unlinkButton')}
    </Button>
  );
};
