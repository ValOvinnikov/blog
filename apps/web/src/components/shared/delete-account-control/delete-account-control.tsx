'use client';

import { ACTION_OUTCOME, routes } from '@blog/config';
import { Button } from '@blog/ui/components/atoms/button';
import { TextInput } from '@blog/ui/components/atoms/text-input';
import { useToast } from '@web/context/toast-provider';
import { deleteAccountAction } from '@web/server/account/account-actions/account-actions';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { deleteAccountControlVariants } from './delete-account-control-variants';

export type TDeleteAccountControlProps = {
  handle: string;
};

export const DeleteAccountControl = ({
  handle,
}: TDeleteAccountControlProps) => {
  const t = useTranslations('accountPage.privacy');
  const toast = useToast();
  const [typed, setTyped] = useState('');
  const [isPending, startTransition] = useTransition();
  const s = deleteAccountControlVariants();

  const isArmed = typed.trim().toLowerCase() === handle.toLowerCase();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await toast.promise(
          (async () => {
            const result = await deleteAccountAction();
            if (result.outcome !== ACTION_OUTCOME.SUCCESS) {
              throw new Error('Failed to delete account');
            }
            return result;
          })(),
          {
            loading: { message: t('deleteToastLoadingMessage') },
            success: { message: t('deleteToastSuccessMessage') },
            error: { message: t('deleteError') },
          },
        );
      } catch {
        return;
      }

      await signOut({ callbackUrl: routes.home() });
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
        isDisabled={!isArmed || isPending}
        aria-busy={isPending}
        onClick={handleDelete}
      >
        {t('deleteButton')}
      </Button>
    </>
  );
};
