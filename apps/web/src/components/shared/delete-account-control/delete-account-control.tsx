'use client';

import { routes } from '@blog/config';
import { Button, TextInput } from '@blog/ui/atoms';
import { useToast } from '@web/context/toast-provider';
import { deleteAccountAction } from '@web/server/account/account-actions';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { deleteAccountControlVariants } from './delete-account-control-variants';

export type TDeleteAccountControlProps = {
  /**
   * The signed-in reader's derived handle (`toSessionUsername`) — the exact
   * string (case-insensitively) they must retype to arm the delete button.
   */
  handle: string;
};

/**
 * Slotted into `SettingRow.children` as the sole client boundary; `deleteAccountAction`
 * returns a `Result` so it's wrapped to throw for `toast.promise`'s error branch, and only
 * the success path signs the reader out.
 */
export function DeleteAccountControl({ handle }: TDeleteAccountControlProps) {
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
            if (!result.ok) throw new Error('Failed to delete account');
            return result;
          })(),
          {
            command: t('deleteToastCommand'),
            loading: {
              state: t('deleteToastLoadingState'),
              message: t('deleteToastLoadingMessage'),
            },
            success: {
              state: t('deleteToastSuccessState'),
              message: t('deleteToastSuccessMessage'),
            },
            error: {
              state: t('deleteToastErrorState'),
              message: t('deleteError'),
            },
          },
        );
      } catch {
        // Already surfaced via the `toast.promise` error branch above —
        // swallow here so a failed delete doesn't sign the reader out below.
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
}
