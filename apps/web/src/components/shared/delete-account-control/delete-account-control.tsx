'use client';

import { ACTION_OUTCOME, routes } from '@shinefold/config';
import { Button } from '@shinefold/ui/components/atoms/button';
import { TextInput } from '@shinefold/ui/components/atoms/text-input';
import { useBusyStyle } from '@web/context/busy-style-provider';
import { useActionToast } from '@web/hooks/use-action-toast';
import { deleteAccountAction } from '@web/server/account/account-actions/account-actions';
import { encodeClearedSignedInHint } from '@web/utils/signed-in-hint-cookie';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { deleteAccountControlVariants } from './delete-account-control-variants';

export type TDeleteAccountControlProps = {
  handle: string;
};

export const DeleteAccountControl = ({
  handle,
}: TDeleteAccountControlProps) => {
  const t = useTranslations('accountPage.privacy');
  const { busyStyle, spinnerVariant } = useBusyStyle();
  const { isPending, run } = useActionToast();
  const [typed, setTyped] = useState('');
  const s = deleteAccountControlVariants();

  const isArmed = typed.trim().toLowerCase() === handle.toLowerCase();

  const handleDelete = () => {
    run(deleteAccountAction, {
      loading: t('deleteToastLoadingMessage'),
      success: t('deleteToastSuccessMessage'),
      error: t('deleteError'),
      errorByOutcome: {
        [ACTION_OUTCOME.BLOCKED]: t('deletePlatformRoleError'),
      },
      onSuccess: async () => {
        document.cookie = encodeClearedSignedInHint();
        await signOut({ callbackUrl: routes.home() });
      },
    });
  };

  return (
    <>
      <TextInput
        value={typed}
        onChange={setTyped}
        ariaLabel={t('deleteConfirmAriaLabel')}
        placeholder={t('deleteConfirmPlaceholder', { handle })}
        isDisabled={isPending}
        className={s.field()}
      />
      <Button
        variant="danger"
        isDisabled={!isArmed}
        isBusy={isPending}
        busyLabel={t('deletingLabel')}
        busyStyle={busyStyle}
        spinnerVariant={spinnerVariant}
        onClick={handleDelete}
      >
        {t('deleteButton')}
      </Button>
    </>
  );
};
