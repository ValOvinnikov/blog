'use client';

import { routes } from '@blog/config';
import { Button, TextInput } from '@blog/ui/atoms';
import { useToast } from '@web/components/shared/toast-provider';
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
 * DeleteAccountControl — the `/account` "delete account" row's control-slot
 * client island (#1151/#1154, D15 §4.6/6a): a typed-confirm `TextInput` that
 * arms the danger `Button` only once its value matches `handle`
 * case-insensitively. Slotted into `SettingRow`'s `children` from the
 * server-rendered `AccountPage` (`web-component-practices` Rule 1 — the pure
 * `SettingRow` never wraps this, it just renders it), so only this leaf pays
 * for the client boundary.
 *
 * On confirm: calls the session-gated `deleteAccountAction` server action
 * (which re-reads the session itself — this never trusts a client-supplied
 * id) through `useToast`'s `promise` helper, which shows a `loading` toast
 * while the request is in flight and transitions it to `success`/`error` on
 * settlement. `deleteAccountAction` resolves with a `Result` rather than
 * rejecting on failure, so it's wrapped in a thin async function that throws
 * when `result.ok` is `false` — that's what drives `toast.promise`'s error
 * branch (a retry-less error toast; the account still exists, so a plain
 * "try again" to the same danger button is enough — no `retry` action needed
 * like `BookmarkButton`'s optimistic toggle). Only the true success path
 * signs the reader out and redirects home in one step via `next-auth/react`'s
 * `signOut({ callbackUrl })`. `isPending` (`useTransition`) still separately
 * gates the input/button `disabled` state and the button's `aria-busy` —
 * `toast.promise` owns the toast lifecycle, `useTransition` owns the local
 * pending UI.
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
        disabled={isPending}
        className={s.field()}
      />
      <Button
        variant="danger"
        disabled={!isArmed || isPending}
        aria-busy={isPending}
        onClick={handleDelete}
      >
        {t('deleteButton')}
      </Button>
    </>
  );
}
